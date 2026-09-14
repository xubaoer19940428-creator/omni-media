"""Small, durable billing ledger and PayPal Orders API client.

The browser never receives PayPal credentials.  Orders are created and captured
here, and every order is tied to the authenticated Clerk subject in SQLite.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import sqlite3
import threading
from typing import Any

import requests


_db_lock = threading.Lock()
_schema_ready: set[str] = set()

FREE_DOWNLOAD_LIMIT = 2
SUBSCRIPTION_DAYS = 31


class PayPalRequestError(RuntimeError):
    def __init__(self, message: str, status_code: int, payload: dict[str, Any]):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


def _database_path() -> Path:
    configured = os.environ.get('DATABASE_PATH', 'data/omnimedia.db').strip()
    path = Path(configured).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    path = _database_path()
    connection = sqlite3.connect(path, timeout=10, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA journal_mode=WAL')
    connection.execute('PRAGMA foreign_keys=ON')
    key = str(path.resolve())
    if key not in _schema_ready:
        with _db_lock:
            if key not in _schema_ready:
                connection.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        clerk_user_id TEXT PRIMARY KEY,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS paypal_orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        clerk_user_id TEXT NOT NULL,
                        paypal_order_id TEXT NOT NULL UNIQUE,
                        status TEXT NOT NULL,
                        amount TEXT NOT NULL,
                        currency TEXT NOT NULL,
                        credits INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL,
                        captured_at TEXT,
                        raw_json TEXT,
                        subscription_id TEXT,
                        plan_id TEXT,
                        subscription_status TEXT,
                        subscription_next_billing_at TEXT,
                        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
                    );
                    CREATE INDEX IF NOT EXISTS idx_paypal_orders_user
                        ON paypal_orders(clerk_user_id, created_at DESC);
                    CREATE TABLE IF NOT EXISTS download_usage (
                        clerk_user_id TEXT NOT NULL,
                        period_start TEXT NOT NULL,
                        downloads_used INTEGER NOT NULL DEFAULT 0,
                        updated_at TEXT NOT NULL,
                        PRIMARY KEY (clerk_user_id, period_start),
                        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
                    );
                    """
                )
                # Existing installations pre-date subscription columns.
                for statement in (
                    'ALTER TABLE paypal_orders ADD COLUMN subscription_id TEXT',
                    'ALTER TABLE paypal_orders ADD COLUMN plan_id TEXT',
                    'ALTER TABLE paypal_orders ADD COLUMN subscription_status TEXT',
                    'ALTER TABLE paypal_orders ADD COLUMN subscription_next_billing_at TEXT',
                ):
                    try:
                        connection.execute(statement)
                    except sqlite3.OperationalError as exc:
                        if 'duplicate column name' not in str(exc).lower():
                            raise
                connection.commit()
                _schema_ready.add(key)
    return connection


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _paypal_environment() -> str:
    return os.environ.get('PAYPAL_ENVIRONMENT', 'sandbox').strip().lower()


def paypal_configured() -> bool:
    return bool(
        os.environ.get('PAYPAL_CLIENT_ID', '').strip()
        and os.environ.get('PAYPAL_CLIENT_SECRET', '').strip()
    )


def _paypal_base_url() -> str:
    return (
        'https://api-m.paypal.com'
        if _paypal_environment() == 'live'
        else 'https://api-m.sandbox.paypal.com'
    )


def _paypal_plan_id() -> str:
    return os.environ.get('PAYPAL_PLAN_ID', '').strip()


def _amount() -> str:
    value = os.environ.get('PAYPAL_PLAN_PRICE', '9.90').strip()
    try:
        amount = round(float(value), 2)
    except (TypeError, ValueError):
        amount = 9.90
    return f'{max(0.01, amount):.2f}'


def _currency() -> str:
    value = os.environ.get('PAYPAL_CURRENCY', 'USD').strip().upper()
    return value if len(value) == 3 and value.isalpha() else 'USD'


def _credits() -> int:
    try:
        return max(1, min(100_000, int(os.environ.get('PAYPAL_PLAN_CREDITS', '100'))))
    except (TypeError, ValueError):
        return 100


def _utc_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (TypeError, ValueError):
        return None


def _ensure_user(connection: sqlite3.Connection, clerk_user_id: str) -> None:
    now = _now()
    connection.execute(
        """
        INSERT INTO users (clerk_user_id, created_at, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(clerk_user_id) DO UPDATE SET updated_at = excluded.updated_at
        """,
        (clerk_user_id, now, now),
    )


def _paypal_token() -> str:
    if not paypal_configured():
        raise RuntimeError('PayPal is not configured')
    try:
        response = requests.post(
            f'{_paypal_base_url()}/v1/oauth2/token',
            auth=(os.environ['PAYPAL_CLIENT_ID'], os.environ['PAYPAL_CLIENT_SECRET']),
            data={'grant_type': 'client_credentials'},
            headers={'Accept': 'application/json', 'Accept-Language': 'en_US'},
            timeout=(5, 20),
        )
    except requests.RequestException as exc:
        raise RuntimeError('PayPal authorization is temporarily unavailable') from exc
    if response.status_code >= 400:
        raise RuntimeError('PayPal authorization failed')
    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError('PayPal authorization returned an invalid response') from exc
    token = payload.get('access_token') if isinstance(payload, dict) else None
    if not isinstance(token, str) or not token:
        raise RuntimeError('PayPal authorization returned no token')
    return token


def _paypal_request(method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    token = _paypal_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        **kwargs.pop('headers', {}),
    }
    try:
        response = requests.request(
            method,
            f'{_paypal_base_url()}{path}',
            headers=headers,
            timeout=(5, 30),
            **kwargs,
        )
    except requests.RequestException as exc:
        raise RuntimeError('PayPal is temporarily unavailable') from exc
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    if response.status_code >= 400:
        # Keep provider details out of the response; they often contain IDs or
        # internal diagnostics that are not useful to an end user.
        raise PayPalRequestError('PayPal request failed', response.status_code, payload)
    return payload if isinstance(payload, dict) else {}


def create_order(clerk_user_id: str) -> dict[str, Any]:
    if not paypal_configured():
        raise RuntimeError('PayPal is not configured')
    if not clerk_user_id:
        raise ValueError('An authenticated user is required')

    amount = _amount()
    currency = _currency()
    credits = _credits()
    product_name = os.environ.get('PAYPAL_PRODUCT_NAME', 'OmniMedia Monthly Unlimited').strip()[:127]
    payload = _paypal_request(
        'POST',
        '/v2/checkout/orders',
        headers={'Prefer': 'return=representation'},
        json={
            'intent': 'CAPTURE',
            'purchase_units': [{
                'reference_id': f'omnimedia-{clerk_user_id[:32]}',
                'description': product_name,
                'custom_id': clerk_user_id[:127],
                'amount': {'currency_code': currency, 'value': amount},
            }],
            'application_context': {
                'brand_name': 'OmniMedia',
                'landing_page': 'LOGIN',
                'user_action': 'PAY_NOW',
                'shipping_preference': 'NO_SHIPPING',
                'return_url': f"{os.environ.get('PUBLIC_APP_URL', 'https://useomnimedia.com').rstrip('/')}/billing/success/",
                'cancel_url': f"{os.environ.get('PUBLIC_APP_URL', 'https://useomnimedia.com').rstrip('/')}/billing/cancel/",
            },
        },
    )
    order_id = payload.get('id')
    if not isinstance(order_id, str) or not order_id:
        raise RuntimeError('PayPal returned an invalid order')

    connection = _connect()
    try:
        _ensure_user(connection, clerk_user_id)
        connection.execute(
            """
            INSERT INTO paypal_orders
                (clerk_user_id, paypal_order_id, status, amount, currency, credits, created_at, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (clerk_user_id, order_id, 'CREATED', amount, currency, credits, _now(), None),
        )
        connection.commit()
    finally:
        connection.close()

    approve_url = next(
        (link.get('href') for link in payload.get('links', [])
         if isinstance(link, dict) and link.get('rel') in {'approve', 'payer-action'}),
        None,
    )
    return {
        'order_id': order_id,
        'status': 'CREATED',
        'amount': amount,
        'currency': currency,
        'credits': credits,
        'approval_url': approve_url,
    }


def create_subscription(clerk_user_id: str) -> dict[str, Any]:
    """Create a recurring monthly PayPal subscription for the signed-in user."""
    if not paypal_configured():
        raise RuntimeError('PayPal is not configured')
    plan_id = _paypal_plan_id()
    if not plan_id:
        raise RuntimeError('PayPal monthly plan is not configured')
    if not clerk_user_id:
        raise ValueError('An authenticated user is required')

    payload = _paypal_request(
        'POST',
        '/v1/billing/subscriptions',
        headers={'Prefer': 'return=representation'},
        json={
            'plan_id': plan_id,
            'custom_id': clerk_user_id[:127],
            'application_context': {
                'brand_name': 'OmniMedia',
                'locale': 'en-US',
                'shipping_preference': 'NO_SHIPPING',
                'user_action': 'SUBSCRIBE_NOW',
                'return_url': f"{os.environ.get('PUBLIC_APP_URL', 'https://useomnimedia.com').rstrip('/')}/billing/success/",
                'cancel_url': f"{os.environ.get('PUBLIC_APP_URL', 'https://useomnimedia.com').rstrip('/')}/billing/cancel/",
            },
        },
    )
    subscription_id = payload.get('id')
    if not isinstance(subscription_id, str) or not subscription_id:
        raise RuntimeError('PayPal returned an invalid subscription')
    connection = _connect()
    try:
        _ensure_user(connection, clerk_user_id)
        connection.execute(
            """
            INSERT INTO paypal_orders
                (clerk_user_id, paypal_order_id, status, amount, currency, credits, created_at, raw_json, subscription_id, plan_id, subscription_status, subscription_next_billing_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                clerk_user_id,
                subscription_id,
                'APPROVAL_PENDING',
                _amount(),
                _currency(),
                0,
                _now(),
                _json(payload),
                subscription_id,
                plan_id,
                str(payload.get('status') or 'APPROVAL_PENDING').upper(),
                _subscription_next_billing_at(payload),
            ),
        )
        connection.commit()
    finally:
        connection.close()
    approve_url = next(
        (link.get('href') for link in payload.get('links', [])
         if isinstance(link, dict) and link.get('rel') in {'approve', 'payer-action'}),
        None,
    )
    return {
        'subscription_id': subscription_id,
        'status': str(payload.get('status') or 'APPROVAL_PENDING').upper(),
        'amount': _amount(),
        'currency': _currency(),
        'interval': 'month',
        'unlimited': True,
        'approval_url': approve_url,
    }


def capture_order(clerk_user_id: str, paypal_order_id: str) -> dict[str, Any]:
    if not paypal_configured():
        raise RuntimeError('PayPal is not configured')
    if not paypal_order_id or len(paypal_order_id) > 64:
        raise ValueError('A valid PayPal order ID is required')

    connection = _connect()
    try:
        row = connection.execute(
            'SELECT * FROM paypal_orders WHERE paypal_order_id = ? AND clerk_user_id = ?',
            (paypal_order_id, clerk_user_id),
        ).fetchone()
        if row is None:
            raise LookupError('PayPal order not found')
        if row['status'] == 'COMPLETED':
            return {
                'order_id': row['paypal_order_id'],
                'status': row['status'],
                'amount': row['amount'],
                'currency': row['currency'],
                'credits_granted': row['credits'],
                'captured_at': row['captured_at'],
                'idempotent': True,
            }
        subscription_id = row['subscription_id'] if 'subscription_id' in row.keys() else None
    finally:
        connection.close()

    if subscription_id:
        payload = _paypal_request('GET', f'/v1/billing/subscriptions/{subscription_id}')
        status = str(payload.get('status') or '').upper()
        if status not in {'ACTIVE', 'APPROVED'}:
            raise RuntimeError('PayPal subscription has not been activated')
        if _paypal_plan_id() and str(payload.get('plan_id') or '') != _paypal_plan_id():
            raise RuntimeError('PayPal subscription plan could not be verified')
        provider_user_id = payload.get('custom_id')
        if str(provider_user_id or '') != clerk_user_id:
            raise RuntimeError('PayPal subscription does not belong to this account')
        captured_at = _now()
        connection = _connect()
        try:
            connection.execute(
                """
                UPDATE paypal_orders
                SET status = 'COMPLETED', captured_at = ?, raw_json = ?,
                    subscription_status = ?, subscription_next_billing_at = ?
                WHERE paypal_order_id = ? AND clerk_user_id = ? AND status != 'COMPLETED'
                """,
                (
                    captured_at,
                    _json(payload),
                    status,
                    _subscription_next_billing_at(payload),
                    paypal_order_id,
                    clerk_user_id,
                ),
            )
            connection.commit()
            row = connection.execute(
                'SELECT * FROM paypal_orders WHERE paypal_order_id = ? AND clerk_user_id = ?',
                (paypal_order_id, clerk_user_id),
            ).fetchone()
        finally:
            connection.close()
        if row is None:
            raise LookupError('PayPal subscription not found')
        return {
            'order_id': row['paypal_order_id'],
            'subscription_id': subscription_id,
            'status': row['status'],
            'amount': row['amount'],
            'currency': row['currency'],
            'interval': 'month',
            'unlimited': True,
            'captured_at': row['captured_at'],
            'idempotent': False,
        }

    already_captured = False
    try:
        payload = _paypal_request('POST', f'/v2/checkout/orders/{paypal_order_id}/capture', json={})
    except PayPalRequestError as exc:
        error_name = str(exc.payload.get('name') or '').upper()
        if exc.status_code in {400, 409, 422} and error_name in {'ORDER_ALREADY_CAPTURED', 'ORDER_NOT_APPROVED'}:
            # A worker can crash after PayPal captures but before SQLite is
            # updated. Re-read the provider order and reconcile on retry.
            payload = _paypal_request('GET', f'/v2/checkout/orders/{paypal_order_id}')
            already_captured = error_name == 'ORDER_ALREADY_CAPTURED'
        else:
            raise
    status = str(payload.get('status') or '').upper()
    if status != 'COMPLETED':
        raise RuntimeError('PayPal payment has not completed')

    # Confirm the captured amount against the immutable server-side order row;
    # never grant credits solely because a provider response says "COMPLETED".
    captured_amount = None
    captured_currency = None
    for purchase_unit in payload.get('purchase_units', []):
        if not isinstance(purchase_unit, dict):
            continue
        payments = purchase_unit.get('payments') or {}
        for capture in payments.get('captures', []) if isinstance(payments, dict) else []:
            if isinstance(capture, dict) and str(capture.get('status') or '').upper() == 'COMPLETED':
                amount = capture.get('amount')
                if isinstance(amount, dict):
                    captured_amount = amount.get('value')
                    captured_currency = amount.get('currency_code')
                    break
        if captured_amount is not None:
            break
    if captured_amount is None or str(captured_amount) != str(row['amount']) or str(captured_currency).upper() != str(row['currency']).upper():
        raise RuntimeError('PayPal payment amount could not be verified')

    captured_at = _now()
    connection = _connect()
    try:
        connection.execute(
            """
            UPDATE paypal_orders
            SET status = 'COMPLETED', captured_at = ?, raw_json = ?
            WHERE paypal_order_id = ? AND clerk_user_id = ? AND status != 'COMPLETED'
            """,
            (captured_at, None, paypal_order_id, clerk_user_id),
        )
        connection.commit()
        row = connection.execute(
            'SELECT * FROM paypal_orders WHERE paypal_order_id = ? AND clerk_user_id = ?',
            (paypal_order_id, clerk_user_id),
        ).fetchone()
    finally:
        connection.close()
    if row is None:
        raise LookupError('PayPal order not found')
    return {
        'order_id': row['paypal_order_id'],
        'status': row['status'],
        'amount': row['amount'],
        'currency': row['currency'],
        'credits_granted': row['credits'],
        'captured_at': row['captured_at'],
        'idempotent': already_captured,
    }


def _subscription_next_billing_at(payload: dict[str, Any]) -> str | None:
    billing_info = payload.get('billing_info')
    if not isinstance(billing_info, dict):
        return None
    value = billing_info.get('next_billing_time')
    return value if isinstance(value, str) else None


def _refresh_subscription(connection: sqlite3.Connection, row: sqlite3.Row) -> tuple[str, str | None] | None:
    """Refresh a subscription only when its cached billing window is stale."""
    subscription_id = row['subscription_id']
    if not isinstance(subscription_id, str) or not subscription_id:
        return None
    try:
        payload = _paypal_request('GET', f'/v1/billing/subscriptions/{subscription_id}')
    except (RuntimeError, PayPalRequestError):
        # A transient provider failure must not revoke an otherwise cached
        # entitlement. The next request will retry once the cache is stale.
        return None
    status = str(payload.get('status') or '').upper() or 'UNKNOWN'
    next_billing_at = _subscription_next_billing_at(payload)
    connection.execute(
        """
        UPDATE paypal_orders
        SET subscription_status = ?, subscription_next_billing_at = ?, raw_json = ?
        WHERE paypal_order_id = ?
        """,
        (status, next_billing_at, _json(payload), row['paypal_order_id']),
    )
    connection.commit()
    return status, next_billing_at


def _active_subscription_until(connection: sqlite3.Connection, clerk_user_id: str) -> str | None:
    row = connection.execute(
        """
        SELECT * FROM paypal_orders
        WHERE clerk_user_id = ? AND status = 'COMPLETED' AND subscription_id IS NOT NULL
        ORDER BY captured_at DESC LIMIT 1
        """,
        (clerk_user_id,),
    ).fetchone()
    now = datetime.now(timezone.utc)
    if row is not None:
        next_billing = _utc_datetime(row['subscription_next_billing_at'])
        status = str(row['subscription_status'] or '').upper()
        # Rows written by the first subscription release have no dedicated
        # status columns yet; recover the provider status from the stored
        # response before deciding whether to refresh or grant access.
        if not status and row['raw_json']:
            try:
                import json
                raw_payload = json.loads(row['raw_json'])
            except (TypeError, ValueError):
                raw_payload = {}
            if isinstance(raw_payload, dict):
                status = str(raw_payload.get('status') or '').upper()
                next_billing = _utc_datetime(_subscription_next_billing_at(raw_payload))
        if status in {'ACTIVE', 'APPROVED'} and next_billing and next_billing > now:
            return next_billing.isoformat()
        refreshed = _refresh_subscription(connection, row)
        if refreshed:
            status, next_billing_value = refreshed
            next_billing = _utc_datetime(next_billing_value)
            if status in {'ACTIVE', 'APPROVED'} and next_billing and next_billing > now:
                return next_billing.isoformat()
        # A subscription with no provider billing window is still granted a
        # short initial window, which covers sandbox responses that omit it.
        captured_at = _utc_datetime(row['captured_at'])
        if status in {'ACTIVE', 'APPROVED'} and captured_at:
            expires = captured_at + timedelta(days=SUBSCRIPTION_DAYS)
            if expires > now:
                return expires.isoformat()

    # Preserve access for legacy one-time orders created before recurring plans
    # were enabled, but never treat a stale subscription as a legacy payment.
    legacy = connection.execute(
        """
        SELECT MAX(captured_at) AS latest_capture FROM paypal_orders
        WHERE clerk_user_id = ? AND status = 'COMPLETED' AND captured_at IS NOT NULL
          AND subscription_id IS NULL
        """,
        (clerk_user_id,),
    ).fetchone()
    captured_at = _utc_datetime(legacy['latest_capture'] if legacy else None)
    if captured_at is None:
        return None
    expires = captured_at + timedelta(days=SUBSCRIPTION_DAYS)
    return expires.isoformat() if expires > now else None


def reserve_download(clerk_user_id: str) -> dict[str, Any]:
    """Reserve one download for a user, or reject an exhausted free account."""
    if not clerk_user_id:
        raise ValueError('An authenticated user is required')
    period = 'lifetime'
    connection = _connect()
    try:
        _ensure_user(connection, clerk_user_id)
        subscription_expires_at = _active_subscription_until(connection, clerk_user_id)
        if subscription_expires_at:
            connection.commit()
            return {
                'allowed': True,
                'is_subscriber': True,
                'subscription_expires_at': subscription_expires_at,
                'downloads_used': 0,
                'downloads_remaining': None,
            }
        row = connection.execute(
            'SELECT downloads_used FROM download_usage WHERE clerk_user_id = ? AND period_start = ?',
            (clerk_user_id, period),
        ).fetchone()
        used = int(row['downloads_used']) if row else 0
        if used >= FREE_DOWNLOAD_LIMIT:
            connection.rollback()
            return {
                'allowed': False,
                'is_subscriber': False,
                'downloads_used': used,
                'downloads_remaining': 0,
                'limit': FREE_DOWNLOAD_LIMIT,
            }
        now = _now()
        connection.execute(
            """
            INSERT INTO download_usage (clerk_user_id, period_start, downloads_used, updated_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(clerk_user_id, period_start) DO UPDATE SET
                downloads_used = download_usage.downloads_used + 1,
                updated_at = excluded.updated_at
            """,
            (clerk_user_id, period, now),
        )
        connection.commit()
        used += 1
        return {
            'allowed': True,
            'is_subscriber': False,
            'downloads_used': used,
            'downloads_remaining': FREE_DOWNLOAD_LIMIT - used,
            'limit': FREE_DOWNLOAD_LIMIT,
        }
    finally:
        connection.close()


def release_download(clerk_user_id: str, reservation: dict[str, Any] | None) -> None:
    """Return a free reservation when the downstream download fails."""
    if not clerk_user_id or not reservation or reservation.get('is_subscriber'):
        return
    period = 'lifetime'
    connection = _connect()
    try:
        connection.execute(
            """
            UPDATE download_usage SET downloads_used = MAX(downloads_used - 1, 0), updated_at = ?
            WHERE clerk_user_id = ? AND period_start = ? AND downloads_used > 0
            """,
            (_now(), clerk_user_id, period),
        )
        connection.commit()
    finally:
        connection.close()


def account_snapshot(clerk_user_id: str) -> dict[str, Any]:
    connection = _connect()
    try:
        _ensure_user(connection, clerk_user_id)
        connection.commit()
        rows = connection.execute(
            """
            SELECT paypal_order_id, status, amount, currency, credits, created_at, captured_at
            FROM paypal_orders WHERE clerk_user_id = ? ORDER BY created_at DESC LIMIT 50
            """,
            (clerk_user_id,),
        ).fetchall()
        subscription_expires_at = _active_subscription_until(connection, clerk_user_id)
        period = 'lifetime'
        usage_row = connection.execute(
            'SELECT downloads_used FROM download_usage WHERE clerk_user_id = ? AND period_start = ?',
            (clerk_user_id, period),
        ).fetchone()
    finally:
        connection.close()
    completed = [row for row in rows if row['status'] == 'COMPLETED']
    return {
        'user_id': clerk_user_id,
        'plan': {
            'name': os.environ.get('PAYPAL_PRODUCT_NAME', 'OmniMedia Monthly Unlimited').strip()[:127],
            'price': _amount(),
            'currency': _currency(),
            'interval': 'month',
            'unlimited': bool(subscription_expires_at),
            'subscription_expires_at': subscription_expires_at,
        },
        'credits_granted': sum(int(row['credits']) for row in completed),
        'downloads_used': int(usage_row['downloads_used']) if usage_row else 0,
        'downloads_remaining': None if subscription_expires_at else max(0, FREE_DOWNLOAD_LIMIT - (int(usage_row['downloads_used']) if usage_row else 0)),
        'free_download_limit': FREE_DOWNLOAD_LIMIT,
        'orders': [dict(row) for row in rows],
    }


def _json(value: Any) -> str:
    import json
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
