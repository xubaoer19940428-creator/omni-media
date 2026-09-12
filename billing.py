"""Small, durable billing ledger and PayPal Orders API client.

The browser never receives PayPal credentials.  Orders are created and captured
here, and every order is tied to the authenticated Clerk subject in SQLite.
"""

from __future__ import annotations

from datetime import datetime, timezone
import os
from pathlib import Path
import sqlite3
import threading
from typing import Any

import requests


_db_lock = threading.Lock()
_schema_ready: set[str] = set()


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
                        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
                    );
                    CREATE INDEX IF NOT EXISTS idx_paypal_orders_user
                        ON paypal_orders(clerk_user_id, created_at DESC);
                    """
                )
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


def _amount() -> str:
    value = os.environ.get('PAYPAL_PLAN_PRICE', '9.99').strip()
    try:
        amount = round(float(value), 2)
    except (TypeError, ValueError):
        amount = 9.99
    return f'{max(0.01, amount):.2f}'


def _currency() -> str:
    value = os.environ.get('PAYPAL_CURRENCY', 'USD').strip().upper()
    return value if len(value) == 3 and value.isalpha() else 'USD'


def _credits() -> int:
    try:
        return max(1, min(100_000, int(os.environ.get('PAYPAL_PLAN_CREDITS', '100'))))
    except (TypeError, ValueError):
        return 100


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
    product_name = os.environ.get('PAYPAL_PRODUCT_NAME', 'OmniMedia Creator Credits').strip()[:127]
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
    finally:
        connection.close()

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
    finally:
        connection.close()
    completed = [row for row in rows if row['status'] == 'COMPLETED']
    return {
        'user_id': clerk_user_id,
        'plan': {
            'name': os.environ.get('PAYPAL_PRODUCT_NAME', 'OmniMedia Creator Credits').strip()[:127],
            'price': _amount(),
            'currency': _currency(),
            'credits_per_order': _credits(),
        },
        'credits_granted': sum(int(row['credits']) for row in completed),
        'orders': [dict(row) for row in rows],
    }


def _json(value: Any) -> str:
    import json
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
