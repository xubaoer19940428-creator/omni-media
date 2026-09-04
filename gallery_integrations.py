"""Optional gallery-dl URL extraction.

gallery-dl remains an external, free/open-source extractor. We only ask it for
URLs and keep the actual response contract bounded; it never writes files into
the application directory.
"""

from __future__ import annotations

import subprocess
import sys
import ipaddress
import importlib.util
import socket
import threading
from typing import Any
from urllib.parse import urlparse

class GalleryNotInstalled(RuntimeError):
    pass


class GalleryError(RuntimeError):
    pass


# gallery-dl can spend up to 90 seconds on an upstream site. Keep the worker
# pool bounded even when requests originate from many different clients.
_GALLERY_SLOTS = threading.BoundedSemaphore(2)


def validate_public_url(value: Any) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > 4096:
        raise GalleryError("A valid public URL is required")
    value = value.strip()
    parsed = urlparse(value)
    try:
        port = parsed.port
    except ValueError as exc:
        raise GalleryError("The URL contains an invalid port") from exc
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise GalleryError("Only HTTP(S) URLs are supported")
    if parsed.username or parsed.password or port not in (None, 80, 443):
        raise GalleryError("The URL contains unsupported credentials or port")
    hostname = parsed.hostname.rstrip(".").lower()
    if hostname in {"localhost", "localhost.localdomain"} or "." not in hostname:
        raise GalleryError("Private or local URLs are not allowed")
    try:
        addresses = [ipaddress.ip_address(hostname)]
    except ValueError:
        try:
            addresses = [
                ipaddress.ip_address(result[4][0])
                for result in socket.getaddrinfo(hostname, port or 443, type=socket.SOCK_STREAM)
            ]
        except socket.gaierror as exc:
            raise GalleryError("Could not resolve the URL host") from exc
    if not addresses or any(not address.is_global for address in addresses):
        raise GalleryError("Private or local URLs are not allowed")
    return value


def resolve_gallery(url: str, *, max_items: int = 40) -> list[str]:
    url = validate_public_url(url)
    if not 1 <= max_items <= 40:
        raise GalleryError("max_items must be between 1 and 40")
    if importlib.util.find_spec("gallery_dl") is None:
        raise GalleryNotInstalled("gallery-dl is not installed")
    command = [
        sys.executable, "-m", "gallery_dl", "--config-ignore", "--no-postprocessors",
        "--get-urls", "--quiet", "--no-input", "--http-timeout", "20",
        "--range", f"1-{max_items}", url,
    ]
    if not _GALLERY_SLOTS.acquire(blocking=False):
        raise GalleryError("Gallery extraction is busy; please retry shortly")
    try:
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=90,
                check=False,
            )
        except FileNotFoundError as exc:
            raise GalleryNotInstalled("gallery-dl is not installed") from exc
        except subprocess.TimeoutExpired as exc:
            raise GalleryError("gallery-dl timed out") from exc
    finally:
        _GALLERY_SLOTS.release()
    if completed.returncode != 0:
        raise GalleryError("gallery-dl could not resolve this gallery")

    urls: list[str] = []
    for line in completed.stdout.splitlines()[:200]:
        candidate = line.strip()
        parsed = urlparse(candidate)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            continue
        try:
            safe_url = validate_public_url(candidate)
        except GalleryError:
            continue
        if safe_url not in urls:
            urls.append(safe_url)
        if len(urls) >= max_items:
            break
    if not urls:
        raise GalleryError("No public media URLs were found")
    return urls
