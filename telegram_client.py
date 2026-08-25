"""Optional Telegram MTProto access for media unavailable to public previews.

The client is deliberately opt-in.  It requires a user-authorized Telethon
StringSession and never exposes Telegram file URLs to callers.
"""

import asyncio
import logging
import os
import re
import threading
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse

try:
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    _TELETHON_IMPORT_ERROR = None
except ImportError as exc:  # pragma: no cover - exercised in deployment checks
    TelegramClient = None
    StringSession = None
    _TELETHON_IMPORT_ERROR = exc


logger = logging.getLogger(__name__)
_client_lock = threading.Lock()
_TELEGRAM_URL_RE = re.compile(
    r'^/(?:s/)?([A-Za-z0-9_]{5,32})/(\d+)/?$'
)


class TelegramMediaError(Exception):
    """A safe, user-facing Telegram access failure."""


def _config() -> Optional[Tuple[int, str, str]]:
    if TelegramClient is None:
        return None
    raw_api_id = os.environ.get('TELEGRAM_API_ID', '').strip()
    api_hash = os.environ.get('TELEGRAM_API_HASH', '').strip()
    session = os.environ.get('TELEGRAM_SESSION', '').strip()
    try:
        api_id = int(raw_api_id)
    except (TypeError, ValueError):
        return None
    if api_id <= 0 or not api_hash or not session:
        return None
    return api_id, api_hash, session


def is_configured() -> bool:
    return _config() is not None


def parse_public_post_url(raw_url: str) -> Tuple[str, int]:
    """Accept only public username-based Telegram post URLs."""
    try:
        parsed = urlparse(raw_url)
        port = parsed.port
    except ValueError as exc:
        raise TelegramMediaError('Invalid Telegram link') from exc
    hostname = (parsed.hostname or '').lower()
    if (
        parsed.scheme != 'https'
        or hostname != 't.me'
        or parsed.username
        or parsed.password
        or port not in (None, 443)
        or parsed.query
        or parsed.fragment
    ):
        raise TelegramMediaError('Only public Telegram channel links are supported')
    match = _TELEGRAM_URL_RE.fullmatch(parsed.path)
    if not match:
        raise TelegramMediaError('Only public Telegram channel post links are supported')
    username, message_id = match.groups()
    return username, int(message_id)


async def _load_message(client: Any, raw_url: str) -> Dict[str, Any]:
    username, message_id = parse_public_post_url(raw_url)
    try:
        entity = await client.get_entity(username)
        message = await client.get_messages(entity, ids=message_id)
        if message is None:
            raise TelegramMediaError('The Telegram post was not found or is unavailable')
        media = getattr(message, 'media', None)
        file_info = getattr(message, 'file', None)
        mime_type = getattr(file_info, 'mime_type', '') or ''
        if not media or not (getattr(message, 'video', None) or mime_type.startswith('video/')):
            raise TelegramMediaError('The Telegram post does not contain a downloadable video')
        size = getattr(file_info, 'size', None)
        extension = (getattr(file_info, 'ext', '') or '').lower()
        return {
            'video_id': str(message.id),
            'title': (getattr(message, 'message', '') or f'Telegram video {message.id}')[:200],
            'author': getattr(entity, 'title', None) or getattr(entity, 'username', None) or username,
            'duration': getattr(file_info, 'duration', 0) or 0,
            'size': int(size) if isinstance(size, int) else None,
            'extension': extension,
            'message': message,
        }
    except TelegramMediaError:
        raise
    except Exception as exc:
        logger.warning('[Telegram] MTProto request failed (%s)', type(exc).__name__)
        raise TelegramMediaError('Telegram could not provide this public post') from exc


async def _fetch_message(raw_url: str) -> Dict[str, Any]:
    config = _config()
    if config is None:
        raise TelegramMediaError('Telegram login is not configured on the server')
    api_id, api_hash, session = config
    try:
        client = TelegramClient(StringSession(session), api_id, api_hash)
    except Exception as exc:
        raise TelegramMediaError('Telegram login is unavailable') from exc
    try:
        await client.connect()
        if not await client.is_user_authorized():
            raise TelegramMediaError('The Telegram session is no longer authorized')
        return await _load_message(client, raw_url)
    except TelegramMediaError:
        raise
    except Exception as exc:
        logger.warning('[Telegram] MTProto connection failed (%s)', type(exc).__name__)
        raise TelegramMediaError('Telegram could not provide this public post') from exc
    finally:
        try:
            await client.disconnect()
        except Exception:
            logger.warning('[Telegram] MTProto disconnect failed')


def get_video_info(raw_url: str) -> Dict[str, Any]:
    """Return normalized metadata without exposing a Telegram file URL."""
    with _client_lock:
        info = asyncio.run(_fetch_message(raw_url))
    return {
        'success': True,
        'platform': 'telegram',
        'platform_name': 'Telegram',
        'video_id': info['video_id'],
        'title': info['title'],
        'author': info['author'],
        'video_url': '',
        'cover_url': '',
        'duration': info['duration'],
        'size': info['size'],
    }


async def _download_message(raw_url: str, target: str, max_bytes: Optional[int]) -> str:
    config = _config()
    if config is None:
        raise TelegramMediaError('Telegram login is not configured on the server')
    api_id, api_hash, session = config
    try:
        client = TelegramClient(StringSession(session), api_id, api_hash)
    except Exception as exc:
        raise TelegramMediaError('Telegram login is unavailable') from exc
    target_path = Path(target)
    try:
        await client.connect()
        if not await client.is_user_authorized():
            raise TelegramMediaError('The Telegram session is no longer authorized')
        info = await _load_message(client, raw_url)
        if max_bytes and info['size'] and info['size'] > max_bytes:
            raise TelegramMediaError('The Telegram video exceeds the configured size limit')
        extension = info['extension']
        if extension not in {'.mp4', '.webm', '.mkv', '.mov', '.m4v'}:
            raise TelegramMediaError('The Telegram video format is not supported')
        target_path = target_path.with_suffix(extension)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        def enforce_size(downloaded_bytes: int, _total_bytes: int) -> None:
            if max_bytes and downloaded_bytes > max_bytes:
                raise TelegramMediaError('The Telegram video exceeds the configured size limit')

        downloaded = await client.download_media(
            info['message'],
            file=str(target_path),
            progress_callback=enforce_size,
        )
        if not downloaded or not target_path.is_file() or target_path.stat().st_size <= 0:
            raise TelegramMediaError('Telegram did not return a downloadable video')
        if max_bytes and target_path.stat().st_size > max_bytes:
            target_path.unlink(missing_ok=True)
            raise TelegramMediaError('The Telegram video exceeds the configured size limit')
        return str(target_path)
    except TelegramMediaError:
        target_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        target_path.unlink(missing_ok=True)
        logger.warning('[Telegram] Media download failed (%s)', type(exc).__name__)
        raise TelegramMediaError('Telegram could not download this public video') from exc
    finally:
        try:
            await client.disconnect()
        except Exception:
            logger.warning('[Telegram] MTProto disconnect failed')


def download_video(raw_url: str, target: str, max_bytes: Optional[int]) -> str:
    with _client_lock:
        return asyncio.run(_download_message(raw_url, target, max_bytes))
