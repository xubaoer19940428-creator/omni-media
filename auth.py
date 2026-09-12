"""Minimal Clerk JWT verification for Flask API endpoints."""

from __future__ import annotations

from functools import wraps
import os
import threading
import time
from typing import Any, Callable

import requests


_jwks_cache: dict[str, Any] = {'expires_at': 0.0, 'keys': []}
_jwks_lock = threading.Lock()


class AuthenticationError(ValueError):
    pass


def _clerk_issuer() -> str:
    return os.environ.get('CLERK_ISSUER', '').strip().rstrip('/')


def _jwks_url() -> str:
    configured = os.environ.get('CLERK_JWKS_URL', '').strip()
    if configured:
        return configured
    issuer = _clerk_issuer()
    return f'{issuer}/.well-known/jwks.json' if issuer else ''


def _get_jwks() -> list[dict[str, Any]]:
    url = _jwks_url()
    if not url or not url.startswith('https://'):
        raise AuthenticationError('Clerk authentication is not configured')
    now = time.monotonic()
    if _jwks_cache['expires_at'] > now and _jwks_cache['keys']:
        return _jwks_cache['keys']
    with _jwks_lock:
        if _jwks_cache['expires_at'] > now and _jwks_cache['keys']:
            return _jwks_cache['keys']
        try:
            response = requests.get(url, timeout=(5, 15))
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise AuthenticationError('Could not load Clerk signing keys') from exc
        keys = payload.get('keys') if isinstance(payload, dict) else None
        if not isinstance(keys, list) or not keys:
            raise AuthenticationError('Clerk signing keys are unavailable')
        _jwks_cache.update({'keys': keys, 'expires_at': time.monotonic() + 300})
        return keys


def verify_bearer_token(token: str) -> dict[str, Any]:
    if not isinstance(token, str) or not token:
        raise AuthenticationError('Authentication is required')
    if not _clerk_issuer():
        raise AuthenticationError('Clerk authentication is not configured')
    try:
        import jwt
        from jwt.algorithms import RSAAlgorithm
    except ImportError as exc:
        raise AuthenticationError('JWT verification is unavailable') from exc

    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:
        raise AuthenticationError('Invalid authentication token') from exc
    key_id = header.get('kid')
    algorithm = header.get('alg')
    if algorithm != 'RS256' or not isinstance(key_id, str):
        raise AuthenticationError('Invalid authentication token')
    jwk = next((item for item in _get_jwks() if item.get('kid') == key_id), None)
    if not isinstance(jwk, dict):
        # One refresh handles Clerk key rotation without making every request
        # perform a network call.
        _jwks_cache['expires_at'] = 0
        jwk = next((item for item in _get_jwks() if item.get('kid') == key_id), None)
    if not isinstance(jwk, dict):
        raise AuthenticationError('Invalid authentication token')
    try:
        public_key = RSAAlgorithm.from_jwk(jwk)
        options = {'require': ['exp', 'sub']}
        kwargs: dict[str, Any] = {'algorithms': ['RS256'], 'options': options}
        issuer = _clerk_issuer()
        if issuer:
            kwargs['issuer'] = issuer
        audience = os.environ.get('CLERK_AUDIENCE', '').strip()
        if audience:
            kwargs['audience'] = audience
        claims = jwt.decode(token, public_key, **kwargs)
    except Exception as exc:
        raise AuthenticationError('Invalid authentication token') from exc
    if not isinstance(claims, dict) or not isinstance(claims.get('sub'), str):
        raise AuthenticationError('Invalid authentication token')
    return claims


def bearer_token_from_request(request: Any) -> str:
    header = request.headers.get('Authorization', '')
    scheme, _, value = header.partition(' ')
    if scheme.lower() != 'bearer' or not value.strip():
        raise AuthenticationError('Authentication is required')
    return value.strip()


def require_clerk_auth(view: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(view)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        from flask import jsonify, request, g
        try:
            claims = verify_bearer_token(bearer_token_from_request(request))
        except AuthenticationError as exc:
            response = jsonify({'error': str(exc)})
            response.status_code = 503 if 'not configured' in str(exc) or 'unavailable' in str(exc) else 401
            if response.status_code == 401:
                response.headers['WWW-Authenticate'] = 'Bearer'
            return response
        g.clerk_claims = claims
        g.clerk_user_id = claims['sub']
        return view(*args, **kwargs)

    return wrapped


def require_download_auth(view: Callable[..., Any]) -> Callable[..., Any]:
    """Authenticate downloads when Clerk is configured, preserving local dev.

    Production deployments set ``CLERK_ISSUER`` and therefore require a real
    Clerk bearer token. Local tests and offline development may omit Clerk and
    continue to exercise the downloader without a user account.
    """
    @wraps(view)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        from flask import g, jsonify, request
        if not _clerk_issuer():
            g.clerk_user_id = None
            return view(*args, **kwargs)
        try:
            claims = verify_bearer_token(bearer_token_from_request(request))
        except AuthenticationError as exc:
            response = jsonify({'error': str(exc)})
            response.status_code = 503 if 'not configured' in str(exc) or 'unavailable' in str(exc) else 401
            if response.status_code == 401:
                response.headers['WWW-Authenticate'] = 'Bearer'
            return response
        g.clerk_claims = claims
        g.clerk_user_id = claims['sub']
        return view(*args, **kwargs)

    return wrapped
