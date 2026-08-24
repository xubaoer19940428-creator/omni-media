from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlparse
import base64
import hashlib
import ipaddress
import logging
import math
import os
import re
import shutil
import socket
import threading
import time
import uuid

import requests
from flask import Flask, Response, g, jsonify, render_template, request, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix

from storage import StoragePublishError, create_storage_backend
from universal_downloader import UniversalDownloader


LOG_LEVEL = getattr(logging, os.environ.get('LOG_LEVEL', 'INFO').upper(), logging.INFO)
logging.basicConfig(
    level=LOG_LEVEL,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
)


def _env_int(name, default, minimum=1):
    try:
        return max(minimum, int(os.environ.get(name, default)))
    except (TypeError, ValueError):
        return default


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = _env_int('MAX_REQUEST_BYTES', 64 * 1024)

if (
    os.environ.get('RAILWAY_ENVIRONMENT_NAME')
    or os.environ.get('TRUST_PROXY', '').lower() in {'1', 'true', 'yes'}
):
    # Enable only when the app is reachable exclusively through one trusted proxy.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

DOWNLOAD_DIR = os.path.abspath(os.environ.get('DOWNLOAD_DIR', 'downloads'))
Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

MAX_DOWNLOAD_BYTES = _env_int('MAX_DOWNLOAD_BYTES', 512 * 1024 * 1024)
MIN_FREE_DISK_BYTES = _env_int('MIN_FREE_DISK_BYTES', 1024 * 1024 * 1024)
DOWNLOAD_TTL_SECONDS = _env_int('DOWNLOAD_TTL_SECONDS', 60 * 60)
CLEANUP_INTERVAL_SECONDS = _env_int('CLEANUP_INTERVAL_SECONDS', 60)
MAX_PROXY_IMAGE_BYTES = _env_int('MAX_PROXY_IMAGE_BYTES', 8 * 1024 * 1024)
MAX_PROXY_REDIRECTS = _env_int('MAX_PROXY_REDIRECTS', 3)
DOWNLOAD_RATE_LIMIT = _env_int('DOWNLOAD_RATE_LIMIT', 4)
PARSE_RATE_LIMIT = _env_int('PARSE_RATE_LIMIT', 20)
FILE_RATE_LIMIT = _env_int('FILE_RATE_LIMIT', 60)
CLEANUP_RATE_LIMIT = _env_int('CLEANUP_RATE_LIMIT', 30)
PROXY_RATE_LIMIT = _env_int('PROXY_RATE_LIMIT', 60)
RATE_LIMIT_WINDOW_SECONDS = _env_int('RATE_LIMIT_WINDOW_SECONDS', 60)
MAX_CONCURRENT_DOWNLOADS = _env_int('MAX_CONCURRENT_DOWNLOADS', 2)
MAX_CONCURRENT_PARSES = _env_int('MAX_CONCURRENT_PARSES', 4)
# The public API contract is intentionally capped at ten URLs per request.
# Operators may lower this value, but cannot raise it through configuration.
MAX_BATCH_SIZE = min(_env_int('MAX_BATCH_SIZE', 10), 10)
MAX_RATE_LIMIT_CLIENTS = _env_int('MAX_RATE_LIMIT_CLIENTS', 10_000)
BATCH_RATE_LIMIT = _env_int('BATCH_RATE_LIMIT', 4)

FRONTEND_DIR = Path(
    os.environ.get('FRONTEND_DIR', Path(__file__).parent / 'frontend' / 'out')
).resolve()
CORS_ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3001,http://127.0.0.1:3001',
    ).split(',')
    if origin.strip()
}


def _frontend_script_hashes():
    index_path = FRONTEND_DIR / 'index.html'
    if not index_path.is_file():
        return ()
    try:
        html = index_path.read_text(encoding='utf-8')
    except OSError:
        logging.exception('Could not read the exported frontend for CSP hashing')
        return ()

    hashes = []
    for match in re.finditer(
        r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        digest = hashlib.sha256(match.group(1).encode('utf-8')).digest()
        hashes.append(f"'sha256-{base64.b64encode(digest).decode('ascii')}'")
    return tuple(dict.fromkeys(hashes))


FRONTEND_SCRIPT_HASHES = _frontend_script_hashes()

DOWNLOAD_FILENAME_RE = re.compile(
    r'^[a-z][a-z0-9_]{0,31}_[0-9a-f]{32}\.(?:mp4|webm|mkv|mov|m4a|m4v)$'
)
ALLOWED_IMAGE_HOST_SUFFIXES = (
    'cdninstagram.com',
    'fbcdn.net',
    'instagram.com',
)
ALLOWED_IMAGE_CONTENT_TYPES = {
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
}
REQUEST_ID_RE = re.compile(r'^[A-Za-z0-9_-]{8,64}$')

_download_slots = threading.BoundedSemaphore(MAX_CONCURRENT_DOWNLOADS)
_parse_slots = threading.BoundedSemaphore(MAX_CONCURRENT_PARSES)
_rate_limit_state = defaultdict(deque)
_rate_limit_lock = threading.Lock()
_cleanup_check_lock = threading.Lock()
_last_cleanup_check = 0.0
_image_session = requests.Session()
_image_session.trust_env = False

downloader = UniversalDownloader(DOWNLOAD_DIR)
storage_backend = create_storage_backend()


class ImageProxyError(Exception):
    def __init__(self, message, status_code):
        super().__init__(message)
        self.status_code = status_code


def _json_object():
    if not request.is_json:
        return None
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def _cors_origin():
    origin = request.headers.get('Origin', '')
    if origin and ('*' in CORS_ALLOWED_ORIGINS or origin in CORS_ALLOWED_ORIGINS):
        return origin
    return None


def _operation_timing(stage, started_at, **fields):
    details = ' '.join(
        f'{key}={value}' for key, value in fields.items() if value is not None
    )
    logging.info(
        'operation_timing request_id=%s stage=%s duration_ms=%.1f%s',
        g.request_id,
        stage,
        (time.monotonic() - started_at) * 1000,
        f' {details}' if details else '',
    )


def _normalize_parse_result(result, original_url):
    """Expose a stable, flat API shape while retaining legacy video_info."""
    normalized = dict(result)
    normalized['original_url'] = downloader.extract_url_from_text(original_url)

    video_info = result.get('video_info')
    if not isinstance(video_info, dict):
        return normalized

    normalized.update({
        'platform_key': result.get('platform'),
        'title': video_info.get('title', ''),
        'author': video_info.get('author', ''),
        'video_url': video_info.get('video_url', ''),
        'cover_url': video_info.get('cover_url', ''),
        'duration': video_info.get('duration', 0),
        'likes': video_info.get('like_count', 0),
        'views': video_info.get('view_count', 0),
        'comments': video_info.get('comment_count', 0),
    })
    return normalized


def _parse_media(share_url):
    clean_url = (
        downloader.extract_url_from_text(share_url)
        if isinstance(share_url, str)
        else ''
    )
    if not isinstance(share_url, str) or not share_url.strip():
        return {
            'success': False,
            'error': 'Please provide a video share link',
            'original_url': clean_url,
        }, 400
    if len(share_url) > 4096:
        return {
            'success': False,
            'error': 'The video URL is too long',
            'original_url': clean_url,
        }, 400

    platform_key, _platform_name = downloader.detect_platform(share_url)
    if platform_key in ('unknown', 'other'):
        return {
            'success': False,
            'error': 'This platform is not supported',
            'original_url': clean_url,
        }, 400

    if not _parse_slots.acquire(blocking=False):
        return {
            'success': False,
            'error': 'The parsing service is busy. Please try again shortly',
            'original_url': clean_url,
        }, 429

    try:
        result = downloader.process_url(share_url)
        normalized = _normalize_parse_result(result, share_url)
        return normalized, 200 if normalized.get('success') else 400
    except Exception:
        logging.exception('Unexpected parse endpoint failure')
        return {
            'success': False,
            'error': 'The parsing service encountered an error',
            'original_url': downloader.extract_url_from_text(share_url),
        }, 500
    finally:
        _parse_slots.release()


def _rate_limit_response(scope, limit):
    client_ip = request.remote_addr or 'unknown'
    key = (scope, client_ip)
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS

    with _rate_limit_lock:
        if key not in _rate_limit_state and len(_rate_limit_state) >= MAX_RATE_LIMIT_CLIENTS:
            _rate_limit_state.pop(next(iter(_rate_limit_state)), None)
        entries = _rate_limit_state[key]
        while entries and entries[0] <= cutoff:
            entries.popleft()
        if len(entries) >= limit:
            retry_after = max(1, math.ceil(entries[0] + RATE_LIMIT_WINDOW_SECONDS - now))
        else:
            entries.append(now)
            retry_after = 0

    if not retry_after:
        return None

    response = jsonify({'error': 'Too many requests. Please try again later'})
    response.status_code = 429
    response.headers['Retry-After'] = str(retry_after)
    return response


def _safe_download_path(filename, require_exists=False):
    if not isinstance(filename, str) or not DOWNLOAD_FILENAME_RE.fullmatch(filename):
        return None

    base_dir = Path(DOWNLOAD_DIR).resolve()
    candidate = base_dir / filename
    if candidate.is_symlink():
        return None

    try:
        resolved = candidate.resolve(strict=require_exists)
    except (FileNotFoundError, OSError):
        return None

    if resolved.parent != base_dir:
        return None
    if require_exists and not resolved.is_file():
        return None
    return resolved


def _remove_download_stem(stem):
    for candidate in Path(DOWNLOAD_DIR).glob(f'{stem}.*'):
        safe_candidate = _safe_download_path(candidate.name, require_exists=True)
        if safe_candidate:
            try:
                safe_candidate.unlink()
            except OSError:
                logging.warning('Could not remove partial download %s', safe_candidate)


def _remove_expired_downloads():
    cutoff = time.time() - DOWNLOAD_TTL_SECONDS
    try:
        candidates = list(Path(DOWNLOAD_DIR).iterdir())
    except OSError:
        logging.exception('Could not inspect the download cache')
        return

    for candidate in candidates:
        safe_candidate = _safe_download_path(candidate.name, require_exists=True)
        if safe_candidate is None:
            continue
        try:
            if safe_candidate.stat().st_mtime < cutoff:
                safe_candidate.unlink()
        except OSError:
            logging.warning('Could not remove expired download %s', safe_candidate)


def _maybe_remove_expired_downloads(force=False):
    global _last_cleanup_check

    now = time.monotonic()
    if not force and now - _last_cleanup_check < CLEANUP_INTERVAL_SECONDS:
        return
    if not _cleanup_check_lock.acquire(blocking=False):
        return

    try:
        now = time.monotonic()
        if not force and now - _last_cleanup_check < CLEANUP_INTERVAL_SECONDS:
            return
        _last_cleanup_check = now
        _remove_expired_downloads()
    finally:
        _cleanup_check_lock.release()


def _validate_proxy_image_url(image_url):
    if not isinstance(image_url, str) or not image_url or len(image_url) > 2048:
        raise ImageProxyError('Invalid image URL', 400)

    try:
        parsed = urlparse(image_url)
        port = parsed.port
    except ValueError as exc:
        raise ImageProxyError('Invalid image URL', 400) from exc

    if parsed.scheme != 'https' or not parsed.hostname:
        raise ImageProxyError('Only HTTPS image URLs are allowed', 400)
    if parsed.username or parsed.password or port not in (None, 443):
        raise ImageProxyError('Invalid image URL', 400)

    try:
        hostname = parsed.hostname.rstrip('.').encode('idna').decode('ascii').lower()
    except UnicodeError as exc:
        raise ImageProxyError('Invalid image hostname', 400) from exc

    if not any(
        hostname == suffix or hostname.endswith(f'.{suffix}')
        for suffix in ALLOWED_IMAGE_HOST_SUFFIXES
    ):
        raise ImageProxyError('This image host is not allowed', 400)

    try:
        addresses = {
            result[4][0]
            for result in socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
        }
    except socket.gaierror as exc:
        raise ImageProxyError('Could not resolve the image host', 502) from exc

    if not addresses:
        raise ImageProxyError('Could not resolve the image host', 502)

    try:
        if any(not ipaddress.ip_address(address).is_global for address in addresses):
            raise ImageProxyError('Private network image targets are not allowed', 400)
    except ValueError as exc:
        raise ImageProxyError('Invalid image host address', 400) from exc

    return image_url


def _fetch_proxy_image(image_url):
    current_url = image_url
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8',
        'Referer': 'https://www.instagram.com/',
    }

    for redirect_count in range(MAX_PROXY_REDIRECTS + 1):
        _validate_proxy_image_url(current_url)
        try:
            upstream = _image_session.get(
                current_url,
                headers=headers,
                timeout=(3.05, 10),
                stream=True,
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            raise ImageProxyError('Could not fetch the image', 502) from exc

        if upstream.status_code in {301, 302, 303, 307, 308}:
            location = upstream.headers.get('Location', '')
            upstream.close()
            if not location or redirect_count >= MAX_PROXY_REDIRECTS:
                raise ImageProxyError('Too many image redirects', 502)
            current_url = urljoin(current_url, location)
            continue

        if upstream.status_code != 200:
            upstream.close()
            raise ImageProxyError('The image host returned an error', 502)

        content_type = upstream.headers.get('Content-Type', '').split(';', 1)[0].lower()
        if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            upstream.close()
            raise ImageProxyError('The upstream response is not a supported image', 415)

        try:
            content_length = int(upstream.headers.get('Content-Length', 0))
        except (TypeError, ValueError):
            content_length = 0
        if content_length > MAX_PROXY_IMAGE_BYTES:
            upstream.close()
            raise ImageProxyError('The image is too large', 413)

        content = bytearray()
        try:
            for chunk in upstream.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                content.extend(chunk)
                if len(content) > MAX_PROXY_IMAGE_BYTES:
                    raise ImageProxyError('The image is too large', 413)
        except requests.RequestException as exc:
            raise ImageProxyError('Could not read the image response', 502) from exc
        finally:
            upstream.close()

        return bytes(content), content_type

    raise ImageProxyError('Too many image redirects', 502)


@app.before_request
def begin_request_observation():
    supplied_request_id = request.headers.get('X-Request-ID', '')
    g.request_id = (
        supplied_request_id
        if REQUEST_ID_RE.fullmatch(supplied_request_id)
        else uuid.uuid4().hex
    )
    g.request_started_at = time.monotonic()


@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS' and request.path.startswith('/api/'):
        response = Response(status=204)
        allowed_origin = _cors_origin()
        if allowed_origin:
            response.headers['Access-Control-Allow-Origin'] = allowed_origin
            response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Request-ID'
        response.headers['Access-Control-Expose-Headers'] = 'X-Request-ID'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response


@app.after_request
def add_security_headers(response):
    allowed_origin = _cors_origin()
    if allowed_origin:
        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Vary'] = 'Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Request-ID'
    response.headers['Access-Control-Expose-Headers'] = 'X-Request-ID'
    response.headers['X-Request-ID'] = g.request_id
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Referrer-Policy', 'no-referrer')
    response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    response.headers.setdefault(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()',
    )
    script_sources = "'self'"
    if FRONTEND_SCRIPT_HASHES:
        script_sources = f"{script_sources} {' '.join(FRONTEND_SCRIPT_HASHES)}"
    response.headers.setdefault(
        'Content-Security-Policy',
        "default-src 'self'; "
        f"script-src {script_sources}; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob: https:; "
        "media-src 'self' blob: https:; "
        "connect-src 'self'; "
        "font-src 'self' data:; object-src 'none'; base-uri 'self'; "
        "frame-ancestors 'self'; form-action 'self'",
    )
    if request.is_secure:
        response.headers.setdefault(
            'Strict-Transport-Security',
            'max-age=31536000',
        )
    if request.path.startswith('/api/'):
        response.headers.setdefault('Cache-Control', 'no-store')
    if request.path.startswith('/api/') or request.path.startswith('/download/'):
        _operation_timing(
            'request_total',
            g.request_started_at,
            method=request.method,
            endpoint=request.url_rule.rule if request.url_rule else 'unmatched',
            status=response.status_code,
        )
    return response


@app.before_request
def cleanup_expired_downloads_periodically():
    _maybe_remove_expired_downloads()


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({'error': 'Request body is too large'}), 413


@app.route('/api/health')
def health_check():
    """服务健康检查接口"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time(),
        'supported_platforms_count': len(downloader.get_supported_platforms()),
        'storage_backend': storage_backend.name,
    })


@app.route('/')
def index():
    frontend_index = FRONTEND_DIR / 'index.html'
    if frontend_index.is_file():
        return send_from_directory(FRONTEND_DIR, 'index.html')
    return render_template(
        'index.html',
        platforms=downloader.get_supported_platforms(),
    )

@app.route('/api/platforms')
def get_platforms():
    """获取支持的平台列表"""
    return jsonify({
        'platforms': downloader.get_supported_platforms()
    })

@app.route('/api/parse', methods=['POST'])
def parse_url():
    """解析视频分享链接（支持多平台）"""
    limited = _rate_limit_response('parse', PARSE_RATE_LIMIT)
    if limited:
        return limited

    data = _json_object()
    if data is None:
        return jsonify({'error': 'A JSON object is required'}), 400

    started_at = time.monotonic()
    try:
        result, status_code = _parse_media(data.get('url', ''))
    except Exception:
        _operation_timing('parse', started_at, status='failed')
        raise
    _operation_timing(
        'parse',
        started_at,
        platform=result.get('platform_key') or result.get('platform'),
        status=status_code,
    )
    return jsonify(result), status_code


@app.route('/api/batch-parse', methods=['POST'])
def batch_parse_urls():
    """Parse a small, bounded batch while preserving input order."""
    limited = _rate_limit_response('batch-parse', BATCH_RATE_LIMIT)
    if limited:
        return limited

    data = _json_object()
    if data is None:
        return jsonify({'error': 'A JSON object is required'}), 400

    urls = data.get('urls')
    if not isinstance(urls, list) or not urls:
        return jsonify({'error': 'A non-empty URL list is required'}), 400
    if len(urls) > MAX_BATCH_SIZE:
        return jsonify({
            'error': f'A maximum of {MAX_BATCH_SIZE} URLs is allowed per batch'
        }), 400

    workers = min(MAX_CONCURRENT_PARSES, len(urls))
    started_at = time.monotonic()
    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            parsed = list(executor.map(_parse_media, urls))
    except Exception:
        _operation_timing(
            'batch_parse',
            started_at,
            count=len(urls),
            status='failed',
        )
        raise

    results = [result for result, _status_code in parsed]
    _operation_timing('batch_parse', started_at, count=len(results), status=200)
    return jsonify({
        'success': True,
        'total': len(results),
        'results': results,
    })

@app.route('/api/download', methods=['POST'])
def download_video():
    """下载视频文件（支持多平台）"""
    limited = _rate_limit_response('download', DOWNLOAD_RATE_LIMIT)
    if limited:
        return limited

    data = _json_object()
    if data is None:
        return jsonify({'error': 'A JSON object is required'}), 400

    original_url = data.get('original_url', '')
    if not isinstance(original_url, str) or not original_url.strip():
        return jsonify({'error': 'The original video URL is required'}), 400
    if len(original_url) > 4096:
        return jsonify({'error': 'The video URL is too long'}), 400

    platform_key, _platform_name = downloader.detect_platform(original_url)
    if platform_key in ('unknown', 'other'):
        return jsonify({'error': 'This platform is not supported'}), 400

    _maybe_remove_expired_downloads(force=True)
    try:
        free_disk_bytes = shutil.disk_usage(DOWNLOAD_DIR).free
    except OSError:
        logging.exception('Could not inspect download disk space')
        return jsonify({'error': 'The download storage is unavailable'}), 500
    if free_disk_bytes < max(MIN_FREE_DISK_BYTES, MAX_DOWNLOAD_BYTES):
        return jsonify({
            'error': 'The download storage is temporarily full'
        }), 507

    if not _download_slots.acquire(blocking=False):
        return jsonify({
            'error': 'The download service is busy. Please try again shortly'
        }), 429

    download_stem = f'{platform_key}_{uuid.uuid4().hex}'
    requested_path = _safe_download_path(f'{download_stem}.mp4')
    if requested_path is None:
        _download_slots.release()
        logging.error('Could not create a safe download path')
        return jsonify({'error': 'The download could not be prepared'}), 500

    try:
        source_started_at = time.monotonic()
        try:
            downloaded_file = downloader.download_video(
                original_url,
                str(requested_path),
                max_bytes=MAX_DOWNLOAD_BYTES,
            )
        except Exception:
            _operation_timing(
                'source_download',
                source_started_at,
                platform=platform_key,
                status='failed',
            )
            raise
        _operation_timing(
            'source_download',
            source_started_at,
            platform=platform_key,
            status='success' if downloaded_file else 'failed',
        )
        if not downloaded_file:
            _remove_download_stem(download_stem)
            return jsonify({'error': 'Download failed. Please try again shortly'}), 500

        if not isinstance(downloaded_file, str) or not downloaded_file.startswith(
            f'{download_stem}.'
        ):
            _remove_download_stem(download_stem)
            logging.warning('Downloader returned a file outside the requested download stem')
            return jsonify({'error': 'The downloaded file could not be accepted'}), 500

        completed_path = _safe_download_path(downloaded_file, require_exists=True)
        if completed_path is None or completed_path.stat().st_size > MAX_DOWNLOAD_BYTES:
            _remove_download_stem(download_stem)
            logging.warning('Downloader returned an unsafe or oversized file')
            return jsonify({'error': 'The downloaded file could not be accepted'}), 500

        publish_started_at = time.monotonic()
        try:
            published = storage_backend.publish(completed_path, completed_path.name)
        except Exception:
            _operation_timing(
                'storage_publish',
                publish_started_at,
                platform=platform_key,
                backend=storage_backend.name,
                status='failed',
            )
            raise
        _operation_timing(
            'storage_publish',
            publish_started_at,
            platform=platform_key,
            backend=storage_backend.name,
            status='success',
        )
        response = {
            'success': True,
            'filename': published.filename,
            'download_url': published.download_url,
        }
        if published.expires_in is not None:
            response['expires_in'] = published.expires_in
        if published.remove_local_file:
            try:
                completed_path.unlink()
            except OSError:
                logging.exception('Could not remove the published temporary download')
        return jsonify(response)

    except StoragePublishError as exc:
        _remove_download_stem(download_stem)
        logging.error('Could not publish the completed download (%s)', type(exc).__name__)
        return jsonify({'error': 'The download storage is temporarily unavailable'}), 503

    except Exception:
        _remove_download_stem(download_stem)
        logging.exception('Unexpected download endpoint failure')
        return jsonify({'error': 'The download service encountered an error'}), 500
    finally:
        _download_slots.release()

@app.route('/download/<filename>')
def serve_file(filename):
    """提供文件下载服务"""
    limited = _rate_limit_response('file', FILE_RATE_LIMIT)
    if limited:
        return limited

    filepath = _safe_download_path(filename, require_exists=True)
    if filepath is None:
        return jsonify({'error': 'File not found'}), 404

    return send_from_directory(
        DOWNLOAD_DIR,
        filepath.name,
        as_attachment=True,
        conditional=True,
    )

@app.route('/api/cleanup', methods=['POST'])
def cleanup_files():
    """清理下载的文件"""
    limited = _rate_limit_response('cleanup', CLEANUP_RATE_LIMIT)
    if limited:
        return limited

    data = _json_object()
    if data is None:
        return jsonify({'error': 'A JSON object is required'}), 400

    filename = data.get('filename', '')
    filepath = _safe_download_path(filename, require_exists=True)
    if filepath is None:
        return jsonify({'error': 'Invalid cached filename'}), 400

    try:
        filepath.unlink()
        return jsonify({'success': True, 'message': 'File deleted'})
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except OSError:
        logging.exception('Could not delete cached download')
        return jsonify({'error': 'Could not clear the cached file'}), 500

@app.route('/api/proxy-image')
def proxy_image():
    """代理外部图片（解决 Instagram 等平台封面图无法直接访问的问题）"""
    limited = _rate_limit_response('proxy-image', PROXY_RATE_LIMIT)
    if limited:
        return limited

    image_url = request.args.get('url', '')
    try:
        content, content_type = _fetch_proxy_image(image_url)
        response = Response(content, mimetype=content_type)
        response.headers['Cache-Control'] = 'public, max-age=3600'
        return response
    except ImageProxyError as exc:
        return jsonify({'error': str(exc)}), exc.status_code
    except Exception:
        logging.exception('Unexpected image proxy failure')
        return jsonify({'error': 'The image proxy encountered an error'}), 500


@app.route('/<path:asset_path>')
def serve_frontend_asset(asset_path):
    """Serve the exported Next.js assets from the production image."""
    if FRONTEND_DIR.is_dir():
        candidate = (FRONTEND_DIR / asset_path).resolve()
        if FRONTEND_DIR not in candidate.parents:
            return jsonify({'error': 'Not found'}), 404
        if candidate.is_file():
            return send_from_directory(FRONTEND_DIR, asset_path)
        directory_index = candidate / 'index.html'
        if directory_index.is_file():
            return send_from_directory(candidate, 'index.html')
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(debug=False, host='0.0.0.0', port=port)
