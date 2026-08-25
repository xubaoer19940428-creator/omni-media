"""
通用视频下载器 - 支持多平台
使用 yt-dlp 实现，支持 Instagram、YouTube、Twitter/X、Facebook 等 1000+ 平台
抖音使用 curl_cffi 模拟浏览器访问移动端页面
"""
import json
import logging
import os
import random
import re
import string
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlparse

import requests

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

try:
    from curl_cffi import requests as cffi_requests
    _has_curl_cffi = True
except ImportError:
    _has_curl_cffi = False

try:
    from douyin_signer import ABogus, BrowserFingerprintGenerator
    _has_douyin_signer = True
except ImportError:
    ABogus = None
    BrowserFingerprintGenerator = None
    _has_douyin_signer = False


logger = logging.getLogger(__name__)


class DownloadSizeLimitExceeded(Exception):
    pass


def _env_timeout(name: str, default: float) -> float:
    try:
        return max(1.0, float(os.environ.get(name, default)))
    except (TypeError, ValueError):
        return default


class UniversalDownloader:
    """通用视频下载器，支持多平台"""
    
    # 支持的平台及其 URL 匹配模式
    PLATFORMS = {
        'tiktok': {
            'name': 'TikTok',
            'patterns': [
                r'tiktok\.com',
                r'vm\.tiktok\.com',
            ],
            'icon': '🎵',
        },
        'douyin': {
            'name': 'Douyin',
            'patterns': [
                r'douyin\.com',
                r'v\.douyin\.com',
                r'iesdouyin\.com',
            ],
            'icon': '🎶',
        },
        'instagram': {
            'name': 'Instagram',
            'patterns': [
                r'instagram\.com',
                r'instagr\.am',
            ],
            'icon': '📸',
        },
        'telegram': {
            'name': 'Telegram',
            'patterns': [
                r't\.me',
                r'telegram\.me',
            ],
            'icon': '✈️',
        },
        'youtube': {
            'name': 'YouTube',
            'patterns': [
                r'youtube\.com',
                r'youtu\.be',
            ],
            'icon': '🎬',
        },
        'twitter': {
            'name': 'Twitter/X',
            'patterns': [
                r'twitter\.com',
                r'x\.com',
            ],
            'icon': '🐦',
        },
        'facebook': {
            'name': 'Facebook',
            'patterns': [
                r'facebook\.com',
                r'fb\.watch',
                r'fb\.com',
            ],
            'icon': '📘',
        },
        'bilibili': {
            'name': 'Bilibili',
            'patterns': [
                r'bilibili\.com',
                r'b23\.tv',
            ],
            'icon': '📺',
        },
        'weibo': {
            'name': 'Weibo',
            'patterns': [
                r'weibo\.com',
                r'weibo\.cn',
            ],
            'icon': '🔴',
        },
        'reddit': {
            'name': 'Reddit',
            'patterns': [
                r'reddit(?:media)?\.com',
                r'redd\.it',
            ],
            'icon': '🤖',
        },
        'vimeo': {
            'name': 'Vimeo',
            'patterns': [
                r'vimeo\.com',
                r'vimeopro\.com',
            ],
            'icon': '🎞️',
        },
        'dailymotion': {
            'name': 'Dailymotion',
            'patterns': [
                r'dailymotion\.com',
                r'dai\.ly',
            ],
            'icon': '▶️',
        },
        'twitch': {
            'name': 'Twitch',
            'patterns': [
                r'twitch\.tv',
            ],
            'icon': '🟣',
        },
        'pinterest': {
            'name': 'Pinterest',
            'patterns': [
                r'pinterest\.(?:com|ca|ch|cl|co\.kr|co\.uk|com\.au|com\.mx|de|dk|es|fr|ie|it|jp|nz|ph|pt|ru|se)',
                r'pin\.it',
            ],
            'icon': '📌',
        },
        'tumblr': {
            'name': 'Tumblr',
            'patterns': [
                r'tumblr\.com',
            ],
            'icon': '📝',
        },
        'rumble': {
            'name': 'Rumble',
            'patterns': [
                r'rumble\.com',
            ],
            'icon': '🟢',
        },
        'xiaohongshu': {
            'name': 'Xiaohongshu',
            'patterns': [
                r'xiaohongshu\.com',
                r'xhslink\.com',
            ],
            'icon': '📕',
        },
        'acfun': {
            'name': 'AcFun',
            'patterns': [
                r'acfun\.cn',
            ],
            'icon': '📺',
        },
        'youku': {
            'name': 'Youku',
            'patterns': [
                r'youku\.com',
                r'tudou\.com',
            ],
            'icon': '🎬',
        },
        'iqiyi': {
            'name': 'iQIYI',
            'patterns': [
                r'iqiyi\.com',
                r'iq\.com',
                r'pps\.tv',
            ],
            'icon': '📽️',
        },
        'tencent_video': {
            'name': 'Tencent Video',
            'patterns': [
                r'v\.qq\.com',
            ],
            'icon': '🐧',
        },
        'ixigua': {
            'name': 'Xigua Video',
            'patterns': [
                r'ixigua\.com',
            ],
            'icon': '🍉',
        },
    }
    
    def __init__(self, download_dir: str = "downloads") -> None:
        self.download_dir = download_dir
        self.connect_timeout = _env_timeout('HTTP_CONNECT_TIMEOUT', 10)
        self.read_timeout = _env_timeout('HTTP_READ_TIMEOUT', 30)
        self.douyin_parse_timeout = (
            min(self.connect_timeout, 5.0),
            min(self.read_timeout, 10.0),
        )
        self.download_timeout = _env_timeout('DOWNLOAD_HTTP_TIMEOUT', 300)
        os.makedirs(self.download_dir, exist_ok=True)

    @property
    def http_timeout(self) -> Tuple[float, float]:
        return self.connect_timeout, self.read_timeout

    @staticmethod
    def _local_chrome_profile_exists() -> bool:
        profile_roots = (
            Path.home() / 'Library/Application Support/Google/Chrome',
            Path.home() / '.config/google-chrome',
            Path.home() / '.config/chromium',
            Path.home() / 'AppData/Local/Google/Chrome/User Data',
        )
        for root in profile_roots:
            if not root.is_dir():
                continue
            if any(root.glob('*/Cookies')) or any(root.glob('*/Network/Cookies')):
                return True
        return False

    def _cookie_options(self, platform_key: str) -> Dict[str, Any]:
        cookie_file = os.environ.get('YTDLP_COOKIE_FILE', '').strip()
        if cookie_file:
            resolved_cookie_file = Path(cookie_file).expanduser()
            if resolved_cookie_file.is_file():
                return {'cookiefile': str(resolved_cookie_file)}
            logger.warning('YTDLP_COOKIE_FILE does not point to a readable file')
            return {}

        browser = os.environ.get('YTDLP_COOKIES_FROM_BROWSER', 'auto').strip().lower()
        if browser in ('', 'off', 'none', 'false', '0'):
            return {}
        if browser == 'auto':
            if platform_key not in ('douyin', 'instagram', 'twitter'):
                return {}
            return {'cookiesfrombrowser': ('chrome',)} if self._local_chrome_profile_exists() else {}
        if re.fullmatch(r'[a-z0-9_-]+', browser):
            return {'cookiesfrombrowser': (browser,)}

        logger.warning('Ignoring invalid YTDLP_COOKIES_FROM_BROWSER value')
        return {}
    
    def detect_platform(self, url: str) -> Tuple[str, str]:
        """
        检测 URL 对应的平台
        返回: (platform_key, platform_name)
        """
        if not url:
            return 'unknown', 'Unknown platform'
        
        url_match = re.search(r'https?://[^\s<>"\']+', url, re.IGNORECASE)
        candidate_url = url_match.group(0) if url_match else url
        parsed_url = urlparse(candidate_url)
        hostname = (parsed_url.hostname or '').lower().rstrip('.')

        if parsed_url.scheme.lower() not in ('http', 'https') or not hostname:
            return 'other', 'Other platform'

        for platform_key, platform_info in self.PLATFORMS.items():
            for pattern in platform_info['patterns']:
                if re.fullmatch(rf'(?:[^.]+\.)*{pattern}', hostname):
                    return platform_key, platform_info['name']
        
        return 'other', 'Other platform'
    
    def get_supported_platforms(self) -> list:
        """获取所有支持的平台列表"""
        return [
            {
                'key': key,
                'name': info['name'],
                'icon': info['icon'],
                'patterns': list(info['patterns']),
            }
            for key, info in self.PLATFORMS.items()
        ]

    def is_profile_url(self, url: str) -> bool:
        """Accept only explicit, known creator-profile URL shapes."""
        extracted_url = self.extract_url_from_text(url)
        platform_key, _ = self.detect_platform(extracted_url)
        if platform_key in ('unknown', 'other'):
            return False

        parsed = urlparse(extracted_url)
        hostname = (parsed.hostname or '').lower().rstrip('.')
        path = parsed.path.lower().rstrip('/')
        query = parsed.query.lower()

        if platform_key == 'tumblr' and hostname not in ('tumblr.com', 'www.tumblr.com'):
            return path in ('', '/')
        if platform_key == 'facebook' and path == '/profile.php':
            return bool(re.search(r'(?:^|&)id=\d+(?:&|$)', query))
        if platform_key == 'facebook' and path in {
            '/photo.php', '/story.php', '/video.php', '/watch', '/reel', '/videos',
        }:
            return False
        if platform_key == 'youku' and path == '/profile/index':
            return bool(re.search(r'(?:^|&)uid=[^&]+', query))

        profile_shapes = {
            'tiktok': r'/@[^/]+',
            'douyin': r'/user/[^/]+',
            'instagram': r'/(?!p$|reel$|tv$|stories$|explore$)[a-z0-9._]+',
            'youtube': r'/(?:@[^/]+|channel/[^/]+|c/[^/]+|user/[^/]+)(?:/videos)?',
            'twitter': r'/(?!i(?:/|$)|home(?:/|$)|explore(?:/|$)|search(?:/|$)|settings(?:/|$))[a-z0-9_]+',
            'bilibili': r'/\d+(?:/video)?',
            'xiaohongshu': r'/user/profile/[^/]+',
            'weibo': r'/(?:u/)?[a-z0-9._-]+',
            'reddit': r'/user/[^/]+',
            'facebook': r'/(?!watch$|reel$|videos$)[a-z0-9._-]+',
            'telegram': r'/[^/]+',
            'pinterest': r'/[^/]+(?:/_(?:created|saved))?',
            'vimeo': r'/(?:user\d+|[a-z][a-z0-9_-]+)',
            'dailymotion': r'/user/[^/]+',
            'twitch': r'/(?!videos$|directory$|downloads$|settings$)[a-z0-9_]+',
            'tumblr': r'/[^/]+',
            'rumble': r'/(?:c|user)/[^/]+',
            'acfun': r'/u/[^/]+',
            'youku': r'/u/[^/]+',
            'iqiyi': r'/u/[^/]+',
            'tencent_video': r'/biu/u/[^/]+',
            'ixigua': r'/home/[^/]+',
        }
        shape = profile_shapes.get(platform_key)
        if platform_key == 'bilibili' and hostname != 'space.bilibili.com':
            return False
        return bool(shape and re.fullmatch(shape, path, re.IGNORECASE))

    @staticmethod
    def _best_thumbnail(info: Dict[str, Any]) -> str:
        """Prefer the largest usable thumbnail from yt-dlp metadata."""
        thumbnail = info.get('thumbnail')
        if isinstance(thumbnail, str) and thumbnail:
            return thumbnail

        candidates = [
            item for item in (info.get('thumbnails') or [])
            if isinstance(item, dict) and isinstance(item.get('url'), str)
        ]
        if not candidates:
            return ''
        best = max(
            candidates,
            key=lambda item: (item.get('width') or 0) * (item.get('height') or 0),
        )
        return best['url']

    @staticmethod
    def _tiktok_profile_from_html(page_html: str) -> Dict[str, Any]:
        """Extract public creator metadata embedded in a TikTok profile page."""
        match = re.search(
            r'<script[^>]+id=["\']__UNIVERSAL_DATA_FOR_REHYDRATION__["\'][^>]*>'
            r'(.*?)</script>',
            page_html,
            re.DOTALL | re.IGNORECASE,
        )
        if not match:
            return {}

        try:
            payload = json.loads(match.group(1))
            detail = (
                payload.get('__DEFAULT_SCOPE__', {})
                .get('webapp.user-detail', {})
                .get('userInfo', {})
            )
            user = detail.get('user') or {}
            stats = detail.get('statsV2') or detail.get('stats') or {}
        except (AttributeError, TypeError, ValueError):
            return {}
        if not isinstance(user, dict) or not user.get('uniqueId'):
            return {}

        def count(field: str) -> int:
            try:
                return max(0, int(stats.get(field) or 0))
            except (TypeError, ValueError):
                return 0

        website = (user.get('bioLink') or {}).get('link') or ''
        if not isinstance(website, str) or not re.match(r'^https?://', website):
            website = ''

        return {
            'id': user.get('id') or '',
            'name': user.get('nickname') or user.get('uniqueId') or '',
            'handle': user.get('uniqueId') or '',
            'avatar': (
                user.get('avatarLarger')
                or user.get('avatarMedium')
                or user.get('avatarThumb')
                or ''
            ),
            'description': user.get('signature') or '',
            'website': website,
            'followers': count('followerCount'),
            'following': count('followingCount'),
            'likes': count('heartCount'),
            'posts': count('videoCount'),
            'friends': count('friendCount'),
            'verified': bool(user.get('verified')),
        }

    def _get_tiktok_profile_metadata(self, profile_url: str) -> Dict[str, Any]:
        """Fetch TikTok's public page because yt-dlp omits profile-level stats."""
        parsed = urlparse(profile_url)
        username_match = re.fullmatch(
            r'/@([a-z0-9._]+)',
            parsed.path.rstrip('/'),
            re.IGNORECASE,
        )
        if not username_match:
            return {}

        canonical_url = f'https://www.tiktok.com/@{username_match.group(1)}'
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            ),
            'Accept-Language': 'en-US,en;q=0.9',
        }
        try:
            if _has_curl_cffi:
                session = cffi_requests.Session(impersonate='chrome120')
                response = session.get(
                    canonical_url,
                    headers=headers,
                    timeout=min(self.read_timeout, 8),
                )
            else:
                response = requests.get(
                    canonical_url,
                    headers=headers,
                    timeout=min(self.read_timeout, 8),
                )
            response.raise_for_status()
            return self._tiktok_profile_from_html(response.text)
        except Exception as exc:
            logger.warning(
                '[TikTok] Public profile metadata was unavailable (%s)',
                type(exc).__name__,
            )
            return {}

    def _get_platform_profile_metadata(
        self,
        platform_key: str,
        profile_url: str,
    ) -> Dict[str, Any]:
        """Route optional profile enrichment without coupling the response to one site."""
        enrichers = {
            'tiktok': self._get_tiktok_profile_metadata,
        }
        enricher = enrichers.get(platform_key)
        return enricher(profile_url) if enricher else {}

    @staticmethod
    def _merge_profile_enrichment(
        profile: Dict[str, Any],
        enrichment: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Merge only meaningful enrichment so partial pages cannot erase metadata."""
        merged = {**profile}
        for field, value in enrichment.items():
            if field == 'verified':
                if value:
                    merged[field] = True
            elif isinstance(value, str):
                if value.strip():
                    merged[field] = value
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                if value > 0:
                    merged[field] = value
        return merged

    @staticmethod
    def _normalized_profile_summary(
        info: Dict[str, Any],
        platform_key: str,
        platform_name: str,
        profile_url: str,
    ) -> Dict[str, Any]:
        """Map extractor-specific profile metadata onto the shared API contract."""
        def first_text(*fields: str) -> str:
            for field in fields:
                value = info.get(field)
                if isinstance(value, str) and value.strip():
                    return value.strip()
            return ''

        def first_count(*fields: str) -> int:
            for field in fields:
                value = info.get(field)
                if value is None or isinstance(value, bool):
                    continue
                try:
                    return max(0, int(value))
                except (TypeError, ValueError):
                    continue
            return 0

        parsed_path = urlparse(profile_url).path.rstrip('/')
        url_handle = ''
        if platform_key in {'tiktok', 'youtube'}:
            handle_match = re.search(r'/(@[^/]+)', parsed_path)
            if handle_match:
                url_handle = handle_match.group(1).lstrip('@')
        elif platform_key in {'instagram', 'twitter'}:
            url_handle = parsed_path.lstrip('/').split('/', 1)[0]

        name = first_text('uploader', 'channel', 'creator', 'playlist_uploader', 'title')
        website = first_text('website', 'external_url', 'bio_url')
        if website and not re.match(r'^https?://', website, re.IGNORECASE):
            website = ''
        return {
            'id': first_text('uploader_id', 'channel_id', 'creator_id', 'id'),
            'name': name or platform_name,
            'handle': (
                url_handle
                or first_text('uploader_id', 'channel_id', 'creator_id')
            ),
            'avatar': UniversalDownloader._best_thumbnail(info),
            'description': first_text(
                'description',
                'channel_description',
                'uploader_description',
                'bio',
            ),
            'url': profile_url,
            'website': website,
            'followers': first_count(
                'channel_follower_count',
                'follower_count',
                'followers',
                'subscriber_count',
            ),
            'following': first_count('following_count', 'following'),
            'likes': first_count(
                'total_like_count',
                'heart_count',
                'likes_count',
            ),
            'posts': first_count(
                'playlist_count',
                'video_count',
                'media_count',
                'post_count',
            ),
            'friends': first_count('friend_count', 'friends_count'),
            'verified': bool(info.get('is_verified') or info.get('verified')),
        }
    
    def extract_url_from_text(self, text: str) -> str:
        """
        从分享文本中提取视频 URL
        支持抖音、TikTok、Instagram 等平台的分享文本格式
        """
        if not text:
            return ""

        # Always use the first URL in source order. This prevents an unsupported
        # outer URL from smuggling a supported URL inside its query string.
        match = re.search(r'https?://[^\s<>"\']+', text, re.IGNORECASE)
        if not match:
            return text.strip()

        url = match.group(0).rstrip('.,;:!?\'"。，；：！？、…)]}）】》」』')
        url = re.sub(
            r'^https?://',
            lambda scheme: scheme.group(0).lower(),
            url,
            flags=re.IGNORECASE,
        )
        # yt-dlp's Telegram extractor uses t.me and the non-preview post path.
        url = re.sub(
            r'^https?://(?:www\.)?telegram\.me/',
            'https://t.me/',
            url,
            flags=re.IGNORECASE,
        )
        url = re.sub(
            r'^(https?://(?:www\.)?t\.me)/s/',
            r'\1/',
            url,
            flags=re.IGNORECASE,
        )
        logger.debug('Extracted a share URL for host %s', urlparse(url).hostname)
        return url
    
    def _resolve_douyin_url(self, url: str) -> str:
        """解析抖音短链接，获取视频ID"""
        try:
            if _has_curl_cffi:
                session = cffi_requests.Session(impersonate='chrome120')
                resp = session.get(
                    url,
                    allow_redirects=True,
                    timeout=self.douyin_parse_timeout,
                )
            else:
                resp = requests.get(
                    url,
                    allow_redirects=True,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
                    },
                    timeout=self.douyin_parse_timeout,
                )
            resp.raise_for_status()
            final_url = str(resp.url)
            match = re.search(r'/video/(\d+)', final_url)
            if match:
                return match.group(1)
        except Exception as exc:
            logger.warning(
                '[Douyin] Could not resolve the short URL (%s)',
                type(exc).__name__,
            )
        return None
    
    def _get_douyin_video_info(self, url: str) -> Dict[str, Any]:
        """
        通过移动端页面获取抖音视频信息
        使用 curl_cffi 模拟浏览器访问 m.douyin.com
        """
        # 提取视频ID
        video_id = None
        match = re.search(r'/video/(\d+)', url)
        if match:
            video_id = match.group(1)
        else:
            video_id = self._resolve_douyin_url(url)
        
        if not video_id:
            return self._error_response("Could not extract the Douyin video ID")
        
        logger.info('[Douyin] Parsing video %s', video_id)
        
        try:
            try:
                signed_detail = self._get_douyin_signed_detail(video_id)
                if signed_detail:
                    signed_info = self._douyin_detail_to_video_info(
                        video_id,
                        signed_detail,
                    )
                    if signed_info.get('success'):
                        return signed_info
                    logger.warning(
                        '[Douyin] Signed detail did not include a playable video'
                    )
            except Exception as exc:
                logger.warning(
                    '[Douyin] Signed detail handling failed (%s)',
                    type(exc).__name__,
                )

            # 访问移动端页面
            if _has_curl_cffi:
                session = cffi_requests.Session(impersonate='chrome120')
            else:
                session = None
                
            mobile_url = f'https://m.douyin.com/share/video/{video_id}'
            headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            }
            
            if session:
                mobile_resp = session.get(
                    mobile_url,
                    headers=headers,
                    timeout=self.douyin_parse_timeout,
                )
            else:
                mobile_resp = requests.get(
                    mobile_url,
                    headers=headers,
                    timeout=self.douyin_parse_timeout,
                )
            mobile_resp.raise_for_status()
            
            html = mobile_resp.text
            logger.debug('[Douyin] Received %d bytes of page data', len(html))
            
            # 从 script 标签中提取视频数据
            scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
            
            for script in scripts:
                if 'play_addr' not in script:
                    continue
                
                # 提取各字段
                title = ''
                author = ''
                video_url = ''
                cover_url = ''
                duration = 0
                like_count = 0
                comment_count = 0
                share_count = 0
                
                # 标题
                desc_match = re.search(r'"desc"\s*:\s*"((?:[^"\\]|\\.)*)"', script)
                if desc_match:
                    title = self._decode_unicode_text(desc_match.group(1))
                
                # 作者
                nick_match = re.search(r'"nickname"\s*:\s*"((?:[^"\\]|\\.)*)"', script)
                if nick_match:
                    author = self._decode_unicode_text(nick_match.group(1))
                
                # 视频播放地址
                play_match = re.search(r'"play_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\["((?:[^"\\]|\\.)*)"', script)
                if play_match:
                    video_url = play_match.group(1).replace('\\u002F', '/').replace('playwm', 'play')
                
                # 封面图
                cover_match = re.search(r'"cover"\s*:\s*\{[^}]*"url_list"\s*:\s*\["((?:[^"\\]|\\.)*)"', script)
                if cover_match:
                    cover_url = cover_match.group(1).replace('\\u002F', '/')
                
                # 时长
                dur_match = re.search(r'"duration"\s*:\s*(\d+)', script)
                if dur_match:
                    duration = int(dur_match.group(1))
                    # 抖音duration是毫秒，转为秒
                    if duration > 1000:
                        duration = duration // 1000
                
                # 统计数据
                like_match = re.search(r'"digg_count"\s*:\s*(\d+)', script)
                if like_match:
                    like_count = int(like_match.group(1))
                
                comment_match = re.search(r'"comment_count"\s*:\s*(\d+)', script)
                if comment_match:
                    comment_count = int(comment_match.group(1))
                
                share_match = re.search(r'"share_count"\s*:\s*(\d+)', script)
                if share_match:
                    share_count = int(share_match.group(1))
                
                if title or video_url:
                    logger.info('[Douyin] Video metadata parsed successfully')
                    
                    return {
                        "success": True,
                        "platform": "douyin",
                        "platform_name": "Douyin",
                        "video_id": video_id,
                        "title": title or f"Douyin video {video_id}",
                        "author": author or "Unknown creator",
                        "video_url": video_url,
                        "cover_url": cover_url,
                        "duration": duration,
                        "like_count": like_count,
                        "comment_count": comment_count,
                        "view_count": share_count,
                    }
            
            return self._error_response("Could not extract video data from the page")
            
        except Exception as exc:
            logger.warning(
                '[Douyin] Video metadata parsing failed (%s)',
                type(exc).__name__,
            )
            return self._error_response(
                'Douyin parsing failed. The platform may be temporarily unavailable'
            )

    def _get_douyin_signed_detail(self, video_id: str) -> Dict[str, Any]:
        """Fetch current public Douyin detail data with an anonymous guest session."""
        if not _has_douyin_signer:
            return {}

        desktop_user_agent = (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 '
            'Safari/537.36 Edg/130.0.0.0'
        )
        register_payload = (
            '{"region":"cn","aid":1768,"needFid":false,'
            '"service":"www.ixigua.com","migrate_info":{"ticket":"",'
            '"source":"node"},"cbUrlProtocol":"https","union":true}'
        )

        session = requests.Session()
        try:
            registered = session.post(
                'https://ttwid.bytedance.com/ttwid/union/register/',
                data=register_payload,
                headers={
                    'User-Agent': desktop_user_agent,
                    'Content-Type': 'application/json; charset=utf-8',
                },
                timeout=self.douyin_parse_timeout,
            )
            registered.raise_for_status()
            ttwid = registered.cookies.get('ttwid')
            if not ttwid:
                return {}

            token_alphabet = string.ascii_letters + string.digits + '-_'
            params = {
                'device_platform': 'webapp',
                'aid': '6383',
                'channel': 'channel_pc_web',
                'pc_client_type': 1,
                'publish_video_strategy_type': 2,
                'pc_libra_divert': 'Windows',
                'version_code': '290100',
                'version_name': '29.1.0',
                'cookie_enabled': 'true',
                'screen_width': 1920,
                'screen_height': 1080,
                'browser_language': 'zh-CN',
                'browser_platform': 'Win32',
                'browser_name': 'Edge',
                'browser_version': '130.0.0.0',
                'browser_online': 'true',
                'engine_name': 'Blink',
                'engine_version': '130.0.0.0',
                'os_name': 'Windows',
                'os_version': 10,
                'cpu_core_num': 12,
                'device_memory': 8,
                'platform': 'PC',
                'downlink': 10,
                'effective_type': '4g',
                'round_trip_time': 100,
                'msToken': ''.join(random.choices(token_alphabet, k=184)),
                'aweme_id': video_id,
            }
            param_string = '&'.join(
                f'{key}={value}' for key, value in params.items()
            )
            fingerprint = BrowserFingerprintGenerator.generate_fingerprint('Edge')
            signed_params = ABogus(
                fp=fingerprint,
                user_agent=desktop_user_agent,
            ).generate_abogus(param_string, '')[0]
            verify_alphabet = string.ascii_letters + string.digits
            s_v_web_id = (
                f'verify_{int(time.time() * 1000)}_'
                + ''.join(random.choices(verify_alphabet, k=36))
            )
            response = session.get(
                'https://www.douyin.com/aweme/v1/web/aweme/detail/'
                f'?{signed_params}',
                headers={
                    'User-Agent': desktop_user_agent,
                    'Referer': 'https://www.douyin.com/',
                    'Cookie': f'ttwid={ttwid}; s_v_web_id={s_v_web_id};',
                },
                timeout=self.douyin_parse_timeout,
            )
            response.raise_for_status()
            payload = response.json()
            detail = payload.get('aweme_detail') if isinstance(payload, dict) else None
            return detail if isinstance(detail, dict) else {}
        except (requests.RequestException, ValueError, TypeError, KeyError):
            logger.warning('[Douyin] Signed public detail request failed')
            return {}
        finally:
            session.close()

    @staticmethod
    def _douyin_detail_to_video_info(
        video_id: str,
        detail: Dict[str, Any],
    ) -> Dict[str, Any]:
        video = detail.get('video') or {}
        play_addr = (
            video.get('play_addr')
            or video.get('play_addr_h264')
            or video.get('play_addr_h265')
            or {}
        )
        play_uri = play_addr.get('uri', '')
        play_urls = play_addr.get('url_list') or []
        if play_uri:
            video_url = (
                'https://www.douyin.com/aweme/v1/play/'
                f'?video_id={play_uri}&ratio=1080p&line=0'
            )
        else:
            video_url = next(
                (
                    candidate.replace('/playwm/', '/play/')
                    for candidate in play_urls
                    if isinstance(candidate, str) and candidate
                ),
                '',
            )

        cover = video.get('cover') or video.get('origin_cover') or {}
        cover_urls = cover.get('url_list') or []
        author = detail.get('author') or {}
        duration_ms = detail.get('duration') or video.get('duration') or 0
        statistics = detail.get('statistics') or {}
        return {
            'success': bool(video_url),
            'platform': 'douyin',
            'platform_name': 'Douyin',
            'video_id': detail.get('aweme_id') or video_id,
            'title': detail.get('desc') or f'Douyin video {video_id}',
            'author': author.get('nickname') or 'Unknown creator',
            'video_url': video_url,
            'cover_url': next(
                (candidate for candidate in cover_urls if candidate),
                '',
            ),
            'duration': int(duration_ms / 1000) if duration_ms else 0,
            'like_count': statistics.get('digg_count', 0),
            'comment_count': statistics.get('comment_count', 0),
            'view_count': statistics.get('play_count', 0),
        }
    
    def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        获取视频信息
        """
        if not yt_dlp:
            return self._error_response("yt-dlp is not installed. Run: pip install yt-dlp")
        
        if not url:
            return self._error_response("Please provide a video link")
        
        platform_key, platform_name = self.detect_platform(url)
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'socket_timeout': self.read_timeout,
            'extractor_retries': 3,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            },
        }
        
        ydl_opts.update(self._cookie_options(platform_key))

        # Telegram 帖子可能包含多个视频；当前界面按单视频处理
        if platform_key == 'telegram':
            ydl_opts['noplaylist'] = True
        
        try:
            logger.info('[%s] Parsing public video metadata', platform_name)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    if platform_key == 'telegram':
                        return self._error_response(
                            "Telegram 网页端未提供该视频的下载地址"
                            "（较大的媒体文件会受限），请在 Telegram 中打开。"
                        )
                    return self._error_response("Could not retrieve video information")
                
                # 提取视频 URL
                video_url = self._extract_best_video_url(info)
                
                return {
                    "success": True,
                    "platform": platform_key,
                    "platform_name": platform_name,
                    "video_id": info.get('id', str(int(time.time()))),
                    "title": info.get('title', info.get('description', 'Untitled video'))[:200],
                    "author": info.get('uploader', info.get('channel', info.get('creator', 'Unknown creator'))),
                    "video_url": video_url,
                    "cover_url": info.get('thumbnail', ''),
                    "duration": info.get('duration', 0),
                    "like_count": info.get('like_count', 0),
                    "view_count": info.get('view_count', 0),
                    "comment_count": info.get('comment_count', 0),
                }
                
        except Exception as exc:
            error_msg = str(exc)
            logger.warning(
                '[%s] Metadata parsing failed (%s)',
                platform_name,
                type(exc).__name__,
            )
            
            # 提供更友好的错误信息
            if 'empty media' in error_msg.lower():
                return self._error_response("This content may be private, or Instagram may require an active Chrome login")
            elif 'login' in error_msg.lower() or 'private' in error_msg.lower():
                return self._error_response("This video may be private or require an account to view")
            elif 'not found' in error_msg.lower() or '404' in error_msg:
                return self._error_response("The video does not exist or has been removed")
            else:
                return self._error_response(
                    "Parsing failed. The platform may be temporarily unavailable"
                )

    def get_profile_info(
        self,
        url: str,
        limit: int = 12,
        cursor: int = 0,
    ) -> Dict[str, Any]:
        """Return a bounded page of public media from a creator profile."""
        if not yt_dlp:
            return self._error_response("yt-dlp is not installed")

        extracted_url = self.extract_url_from_text(url)
        platform_key, platform_name = self.detect_platform(extracted_url)
        if platform_key in ('unknown', 'other'):
            return self._error_response("This platform is not supported")
        if not self.is_profile_url(extracted_url):
            return self._error_response("Please provide a creator profile URL, not a post or playlist URL")

        requested_count = limit + 1
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': 'in_playlist',
            'skip_download': True,
            'lazy_playlist': False,
            'playliststart': cursor + 1,
            'playlistend': cursor + requested_count,
            'socket_timeout': self.read_timeout,
            'extractor_retries': 3,
            'http_headers': {
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/120.0.0.0 Safari/537.36'
                ),
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            },
        }
        ydl_opts.update(self._cookie_options(platform_key))

        try:
            logger.info('[%s] Parsing public creator profile', platform_name)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(extracted_url, download=False)

            raw_entries = list((info or {}).get('entries') or [])
            if not raw_entries:
                return self._error_response(
                    "This URL is not a public creator profile, or the profile has no accessible posts"
                )

            page_entries = raw_entries[:limit]
            items = []
            for entry in page_entries:
                if not isinstance(entry, dict):
                    continue
                item_url = entry.get('webpage_url') or entry.get('url') or ''
                item_platform, _ = self.detect_platform(item_url)
                if item_platform != platform_key:
                    continue

                items.append({
                    'success': True,
                    'platform': platform_key,
                    'platform_key': platform_key,
                    'video_id': entry.get('id', ''),
                    'original_url': item_url,
                    'title': (
                        entry.get('title')
                        or entry.get('description')
                        or 'Untitled media'
                    )[:200],
                    'author': (
                        entry.get('uploader')
                        or entry.get('channel')
                        or entry.get('creator')
                        or ''
                    ),
                    'cover_url': self._best_thumbnail(entry),
                    'duration': entry.get('duration') or 0,
                    'views': entry.get('view_count') or 0,
                    'likes': entry.get('like_count') or 0,
                    'comments': entry.get('comment_count') or 0,
                    'created_at': entry.get('timestamp') or entry.get('upload_date'),
                })

            if not items:
                return self._error_response(
                    "The profile did not expose any supported public media links"
                )

            has_more = len(raw_entries) > limit

            profile = self._normalized_profile_summary(
                info,
                platform_key,
                platform_name,
                extracted_url,
            )
            enrichment = self._get_platform_profile_metadata(
                platform_key,
                extracted_url,
            ) if cursor == 0 else {}
            profile = self._merge_profile_enrichment(profile, enrichment)
            profile['url'] = extracted_url

            return {
                'success': True,
                'platform': platform_key,
                'platform_key': platform_key,
                'platform_name': platform_name,
                'original_url': extracted_url,
                'profile': profile,
                'items': items,
                'count': len(items),
                'has_more': has_more,
                'next_cursor': str(cursor + limit) if has_more else None,
            }
        except Exception as exc:
            error_msg = str(exc).lower()
            logger.warning(
                '[%s] Creator profile parsing failed (%s)',
                platform_name,
                type(exc).__name__,
            )
            if 'login' in error_msg or 'private' in error_msg:
                return self._error_response(
                    "This profile is private or requires an account to view"
                )
            return self._error_response(
                "Profile parsing failed. The platform may not expose this public profile"
            )
    
    def _extract_best_video_url(self, info: Dict) -> str:
        """从 yt-dlp 信息中提取最佳视频 URL"""
        # 优先使用 url 字段
        if info.get('url'):
            return info['url']
        
        # 从 formats 中选择最佳
        formats = info.get('formats', [])
        if not formats:
            return ''
        
        # 优先选择 mp4 格式，无水印
        for fmt in reversed(formats):
            if fmt.get('ext') == 'mp4' and fmt.get('url'):
                url = fmt['url']
                # 跳过带水印的
                if 'wm' not in url.lower():
                    return url
        
        # 回退到任意 mp4
        for fmt in reversed(formats):
            if fmt.get('ext') == 'mp4' and fmt.get('url'):
                return fmt['url']
        
        # 回退到任意格式
        for fmt in reversed(formats):
            if fmt.get('url'):
                return fmt['url']
        
        return ''
    
    @staticmethod
    def _decode_unicode_text(text: str) -> str:
        """正确解码包含 \\uXXXX 的文本"""
        try:
            # 替换 \uXXXX 为实际字符
            def replace_unicode(match):
                return chr(int(match.group(1), 16))
            return re.sub(r'\\u([0-9a-fA-F]{4})', replace_unicode, text)
        except Exception:
            return text
    
    def download_video(
        self,
        url: str,
        filename: Optional[str] = None,
        max_bytes: Optional[int] = None,
    ) -> Optional[str]:
        """
        下载视频
        支持传入分享文本，会自动提取 URL
        """
        if not url:
            return None
        
        # 从分享文本中提取 URL
        extracted_url = self.extract_url_from_text(url)
        if not extracted_url:
            logger.warning('Could not extract a URL from the supplied text')
            return None
        url = extracted_url
        
        if not yt_dlp:
            logger.error('yt-dlp is not installed')
            return None
        
        platform_key, platform_name = self.detect_platform(url)

        if platform_key in ('unknown', 'other'):
            logger.warning('Download rejected for an unsupported platform')
            return None
        
        # 生成文件名
        if not filename:
            timestamp = int(time.time())
            filename = f"{platform_key}_{timestamp}_{uuid.uuid4().hex[:8]}.mp4"
        
        # 处理路径
        if os.path.dirname(filename):
            filepath = filename
        else:
            filepath = os.path.join(self.download_dir, filename)
        
        if not filepath.endswith('.mp4'):
            filepath = filepath + '.mp4'

        base_path = os.path.splitext(filepath)[0]

        def cleanup_partial_files() -> None:
            import glob
            for partial_path in glob.glob(glob.escape(base_path) + '.*'):
                try:
                    if os.path.isfile(partial_path) or os.path.islink(partial_path):
                        os.remove(partial_path)
                except OSError:
                    pass

        def enforce_download_size(status: Dict[str, Any]) -> None:
            if not max_bytes:
                return
            downloaded_bytes = status.get('downloaded_bytes') or 0
            if downloaded_bytes > max_bytes:
                raise yt_dlp.utils.DownloadError('Download exceeds the configured size limit')
        
        ydl_opts = {
            'quiet': False,
            'no_warnings': False,
            'outtmpl': base_path + '.%(ext)s',
            'format': 'best[ext=mp4]/best',
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': url,
            },
            'retries': 3,
            'fragment_retries': 3,
            'extractor_retries': 3,
            'socket_timeout': self.read_timeout,
        }

        if max_bytes:
            ydl_opts['max_filesize'] = max_bytes
            ydl_opts['progress_hooks'] = [enforce_download_size]
        
        ydl_opts.update(self._cookie_options(platform_key))

        # Telegram 帖子可能包含多个视频；下载帖子中的主视频
        if platform_key == 'telegram':
            ydl_opts['noplaylist'] = True
        
        # 抖音使用直接下载视频 URL
        if platform_key == 'douyin':
            # 先解析获取直接视频URL，用 requests 直接下载
            douyin_info = self._get_douyin_video_info(url)
            if douyin_info.get('success') and douyin_info.get('video_url'):
                try:
                    video_direct_url = douyin_info['video_url']
                    logger.info('[Douyin] Downloading the resolved source file')
                    
                    # 先获取重定向后的真实下载地址
                    if _has_curl_cffi:
                        session = cffi_requests.Session(impersonate='chrome120')
                        resp = session.get(
                            video_direct_url,
                            allow_redirects=True,
                            timeout=(self.connect_timeout, self.download_timeout),
                            stream=True,
                        )
                        resp.raise_for_status()
                        declared_length = int(resp.headers.get('Content-Length', 0) or 0)
                        if max_bytes and declared_length > max_bytes:
                            resp.close()
                            logger.warning('[Douyin] Download exceeds the configured size limit')
                            cleanup_partial_files()
                            return None

                        downloaded_bytes = 0
                        try:
                            with open(filepath, 'wb') as f:
                                for chunk in resp.iter_content(chunk_size=65536):
                                    if not chunk:
                                        continue
                                    downloaded_bytes += len(chunk)
                                    if max_bytes and downloaded_bytes > max_bytes:
                                        raise DownloadSizeLimitExceeded(
                                            'Download exceeds the configured size limit'
                                        )
                                    f.write(chunk)
                        finally:
                            resp.close()
                    else:
                        resp = requests.get(video_direct_url,
                            allow_redirects=True, 
                            timeout=(self.connect_timeout, self.download_timeout),
                            headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'},
                            stream=True
                        )
                        resp.raise_for_status()
                        declared_length = int(resp.headers.get('Content-Length', 0) or 0)
                        if max_bytes and declared_length > max_bytes:
                            resp.close()
                            logger.warning('[Douyin] Download exceeds the configured size limit')
                            cleanup_partial_files()
                            return None

                        downloaded_bytes = 0
                        try:
                            with open(filepath, 'wb') as f:
                                for chunk in resp.iter_content(chunk_size=65536):
                                    if not chunk:
                                        continue
                                    downloaded_bytes += len(chunk)
                                    if max_bytes and downloaded_bytes > max_bytes:
                                        raise DownloadSizeLimitExceeded(
                                            'Download exceeds the configured size limit'
                                        )
                                    f.write(chunk)
                        finally:
                            resp.close()
                    
                    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                        file_size = os.path.getsize(filepath) / 1024 / 1024
                        logger.info('[Douyin] Download completed (%.1f MB)', file_size)
                        return os.path.basename(filepath)
                    else:
                        logger.warning('[Douyin] The downloaded file is empty')
                        return None
                except DownloadSizeLimitExceeded:
                    cleanup_partial_files()
                    logger.warning('[Douyin] Download exceeds the configured size limit')
                    return None
                except Exception as exc:
                    cleanup_partial_files()
                    logger.warning(
                        '[Douyin] Direct download failed (%s)',
                        type(exc).__name__,
                    )
                    return None
            else:
                logger.warning('[Douyin] No downloadable source URL was found')
                return None
        
        try:
            logger.info('[%s] Downloading the source file', platform_name)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            # 查找下载的文件
            import glob
            found_files = glob.glob(glob.escape(base_path) + '.*')
            
            for found_file in found_files:
                if os.path.exists(found_file) and os.path.getsize(found_file) > 0:
                    if max_bytes and os.path.getsize(found_file) > max_bytes:
                        cleanup_partial_files()
                        logger.warning(
                            '[%s] Download exceeds the configured size limit',
                            platform_name,
                        )
                        return None
                    logger.info('[%s] Download completed', platform_name)
                    return os.path.basename(found_file)
            
            logger.warning('[%s] No downloaded file was found', platform_name)
            return None
            
        except Exception as exc:
            cleanup_partial_files()
            logger.warning(
                '[%s] Download failed (%s)',
                platform_name,
                type(exc).__name__,
            )
            return None
    
    def _error_response(self, error: str) -> Dict[str, Any]:
        """生成错误响应"""
        return {
            "success": False,
            "error": error,
        }
    
    def process_url(self, url: str) -> Dict[str, Any]:
        """
        处理 URL - 主入口方法
        支持直接传入分享文本，会自动提取 URL
        """
        if not url:
            return self._error_response("Please provide a video link")
        
        # 从分享文本中提取 URL
        extracted_url = self.extract_url_from_text(url)
        
        if not extracted_url:
            return self._error_response("Could not find a video link in the supplied text")
        
        platform_key, platform_name = self.detect_platform(extracted_url)
        
        if platform_key in ('unknown', 'other'):
            return self._error_response("This platform is not supported")
        
        # 抖音使用移动端页面解析（绕过 yt-dlp cookies 问题）
        if platform_key == 'douyin':
            logger.info('[%s] Using the mobile page parser', platform_name)
            info = self._get_douyin_video_info(extracted_url)
            
            if info.get('success'):
                return {
                    "success": True,
                    "platform": platform_key,
                    "platform_name": platform_name,
                    "video_id": info.get('video_id', 'unknown'),
                    "video_info": {
                        "title": info.get('title', 'Untitled video'),
                        "author": info.get('author', 'Unknown creator'),
                        "video_url": info.get('video_url', ''),
                        "cover_url": info.get('cover_url', ''),
                        "duration": info.get('duration', 0),
                        "like_count": info.get('like_count', 0),
                        "view_count": info.get('view_count', 0),
                        "comment_count": info.get('comment_count', 0),
                    },
                    "has_download_url": bool(info.get('video_url')),
                }
            else:
                return self._error_response(info.get('error', 'Douyin parsing failed'))
        
        # 其他平台使用 yt-dlp
        info = self.get_video_info(extracted_url)
        
        if not info.get('success'):
            return info
        
        return {
            "success": True,
            "platform": platform_key,
            "platform_name": platform_name,
            "video_id": info.get('video_id', 'unknown'),
            "video_info": {
                "title": info.get('title', 'Untitled video'),
                "author": info.get('author', 'Unknown creator'),
                "video_url": info.get('video_url', ''),
                "cover_url": info.get('cover_url', ''),
                "duration": info.get('duration', 0),
                "like_count": info.get('like_count', 0),
                "view_count": info.get('view_count', 0),
                "comment_count": info.get('comment_count', 0),
            },
            "has_download_url": bool(info.get('video_url')),
        }


# 单例实例
universal_downloader = UniversalDownloader()
