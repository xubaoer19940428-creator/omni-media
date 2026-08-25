import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import universal_downloader as downloader_module
from app import app
from douyin_signer import ABogus, BrowserFingerprintGenerator
from universal_downloader import UniversalDownloader


REPRESENTATIVE_URLS = {
    'tiktok': 'https://www.tiktok.com/@creator/video/1234567890123456789',
    'douyin': 'https://www.douyin.com/video/1234567890123456789',
    'instagram': 'https://www.instagram.com/reel/ABC_def-12/',
    'telegram': 'https://t.me/public_channel/12345',
    'youtube': 'https://www.youtube.com/watch?v=BaW_jenozKc',
    'twitter': 'https://x.com/creator/status/1234567890123456789',
    'facebook': 'https://www.facebook.com/watch/?v=123456789012345',
    'bilibili': 'https://www.bilibili.com/video/BV1xx411c7mD',
    'weibo': 'https://weibo.com/tv/show/1034:1234567890123456',
    'reddit': 'https://www.reddit.com/r/videos/comments/abc123/example/',
    'vimeo': 'https://vimeo.com/76979871',
    'dailymotion': 'https://www.dailymotion.com/video/x84sh87',
    'twitch': 'https://www.twitch.tv/videos/1234567890',
    'pinterest': 'https://www.pinterest.co.uk/pin/123456789012345678/',
    'tumblr': 'https://example.tumblr.com/post/123456789012/example',
    'rumble': 'https://rumble.com/v123abc-example.html',
    'xiaohongshu': 'https://www.xiaohongshu.com/explore/1234567890abcdef12345678',
    'acfun': 'https://www.acfun.cn/v/ac12345678',
    'youku': 'https://v.youku.com/v_show/id_XNjA0MTY4NTQ4NA==.html',
    'iqiyi': 'https://www.iqiyi.com/v_19rrn9q7l4.html',
    'tencent_video': 'https://v.qq.com/x/page/a1234567890.html',
    'ixigua': 'https://www.ixigua.com/1234567890123456789',
}


class PlatformSupportTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.downloader = UniversalDownloader(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_exactly_22_platforms_are_exposed(self):
        platforms = self.downloader.get_supported_platforms()
        self.assertEqual(22, len(platforms))
        self.assertEqual(list(REPRESENTATIVE_URLS), [item['key'] for item in platforms])

    def test_every_representative_url_maps_to_its_platform(self):
        for expected_platform, url in REPRESENTATIVE_URLS.items():
            with self.subTest(platform=expected_platform):
                actual_platform, _ = self.downloader.detect_platform(url)
                self.assertEqual(expected_platform, actual_platform)

    def test_yt_dlp_has_a_specific_extractor_for_every_platform(self):
        try:
            from yt_dlp.extractor import gen_extractor_classes
        except ImportError:
            self.skipTest('yt-dlp is not installed')

        extractor_classes = list(gen_extractor_classes())
        for platform, url in REPRESENTATIVE_URLS.items():
            with self.subTest(platform=platform):
                matches = [
                    extractor.ie_key()
                    for extractor in extractor_classes
                    if extractor.ie_key() != 'Generic' and extractor.suitable(url)
                ]
                self.assertTrue(matches, f'No yt-dlp extractor matched {url}')

    def test_share_text_uses_the_embedded_supported_url(self):
        platform, _ = self.downloader.detect_platform(
            'Shared from Telegram: https://t.me/public_channel/12345 enjoy'
        )
        self.assertEqual('telegram', platform)

    def test_adversarial_and_unsupported_hosts_are_rejected(self):
        rejected_urls = [
            'https://notreddit.com/video',
            'https://examplex.com/watch',
            'https://example.com/?next=https://x.com/user/status/123',
            'https://dailymotion.com.evil.example/video/x123',
            'https://pinterest.co.uk.evil.example/pin/123',
            'ftp://www.youtube.com/watch?v=BaW_jenozKc',
            'not a URL',
        ]
        for url in rejected_urls:
            with self.subTest(url=url):
                platform, _ = self.downloader.detect_platform(url)
                self.assertEqual('other', platform)

    def test_processing_rejects_a_supported_url_nested_in_an_unsupported_url(self):
        url = 'https://example.com/?next=https://x.com/user/status/123'
        with patch.object(self.downloader, 'get_video_info') as get_video_info:
            result = self.downloader.process_url(url)

        self.assertFalse(result['success'])
        self.assertEqual('This platform is not supported', result['error'])
        get_video_info.assert_not_called()

    def test_share_text_extracts_first_url_case_insensitively_and_trims_punctuation(self):
        cases = {
            'Shared HTTPS://www.youtube.com/watch?v=BaW_jenozKc。':
                'https://www.youtube.com/watch?v=BaW_jenozKc',
            'Watch (https://www.twitch.tv/videos/1234567890)':
                'https://www.twitch.tv/videos/1234567890',
            'First https://vimeo.com/76979871 then https://x.com/user/status/123':
                'https://vimeo.com/76979871',
        }
        for text, expected_url in cases.items():
            with self.subTest(text=text):
                self.assertEqual(expected_url, self.downloader.extract_url_from_text(text))

    def test_current_douyin_share_text_extracts_the_short_link(self):
        share_text = (
            '6.97 Nwf:/ 01/02 r@r.Eh :5pm 小麦和威龙偶遇小博博会发生什么？ '
            '# 三角洲行动 https://v.douyin.com/EtPAAlUsaGU/ '
            '复制此链接，打开Dou音搜索，直接观看视频！'
        )
        self.assertEqual(
            'https://v.douyin.com/EtPAAlUsaGU/',
            self.downloader.extract_url_from_text(share_text),
        )

    def test_current_douyin_detail_builds_a_browser_playable_url(self):
        detail = {
            'aweme_id': '7674193013408681279',
            'desc': '小麦和威龙偶遇小博博会发生什么？',
            'author': {'nickname': '左手动漫'},
            'duration': 97_269,
            'statistics': {
                'digg_count': 12,
                'comment_count': 3,
                'play_count': 456,
            },
            'video': {
                'play_addr': {
                    'uri': 'video-resource-id',
                    'url_list': ['https://cdn.example/fallback.mp4'],
                },
                'cover': {'url_list': ['https://cdn.example/cover.jpg']},
            },
        }

        result = self.downloader._douyin_detail_to_video_info(
            '7674193013408681279',
            detail,
        )

        self.assertTrue(result['success'])
        self.assertEqual('左手动漫', result['author'])
        self.assertEqual(97, result['duration'])
        self.assertEqual(12, result['like_count'])
        self.assertEqual(456, result['view_count'])
        self.assertEqual(
            'https://www.douyin.com/aweme/v1/play/'
            '?video_id=video-resource-id&ratio=1080p&line=0',
            result['video_url'],
        )

    def test_douyin_guest_request_is_signed_and_always_closes_session(self):
        class Response:
            def __init__(self, *, cookies=None, payload=None):
                self.cookies = cookies or {}
                self._payload = payload or {}

            def raise_for_status(self):
                return None

            def json(self):
                return self._payload

        class Session:
            def __init__(self):
                self.post_call = None
                self.get_call = None
                self.closed = False

            def post(self, url, **kwargs):
                self.post_call = (url, kwargs)
                return Response(cookies={'ttwid': 'guest-cookie'})

            def get(self, url, **kwargs):
                self.get_call = (url, kwargs)
                return Response(payload={
                    'aweme_detail': {'aweme_id': '7674193013408681279'},
                })

            def close(self):
                self.closed = True

        class Signer:
            def __init__(self, *, fp, user_agent):
                self.fp = fp
                self.user_agent = user_agent

            def generate_abogus(self, params, body):
                return (f'{params}&a_bogus=test-signature', '', '', body)

        session = Session()
        with (
            patch.object(downloader_module.requests, 'Session', return_value=session),
            patch.object(downloader_module, 'ABogus', Signer),
            patch.object(
                downloader_module.BrowserFingerprintGenerator,
                'generate_fingerprint',
                return_value='test-fingerprint',
            ),
        ):
            detail = self.downloader._get_douyin_signed_detail(
                '7674193013408681279'
            )

        self.assertEqual('7674193013408681279', detail['aweme_id'])
        self.assertIn('/ttwid/union/register/', session.post_call[0])
        self.assertEqual(
            (5.0, 10.0),
            session.post_call[1]['timeout'],
        )
        self.assertIn('aweme_id=7674193013408681279', session.get_call[0])
        self.assertIn('a_bogus=test-signature', session.get_call[0])
        self.assertIn('ttwid=guest-cookie', session.get_call[1]['headers']['Cookie'])
        self.assertIn('s_v_web_id=verify_', session.get_call[1]['headers']['Cookie'])
        self.assertEqual(
            (5.0, 10.0),
            session.get_call[1]['timeout'],
        )
        self.assertTrue(session.closed)

    def test_douyin_signed_failure_falls_back_to_the_mobile_page(self):
        class MobileResponse:
            text = (
                '<script>{"desc":"Fallback","nickname":"Creator",'
                '"play_addr":{"url_list":["https://cdn.example/play/video.mp4"]},'
                '"cover":{"url_list":["https://cdn.example/cover.jpg"]},'
                '"duration":1000}</script>'
            )

            def raise_for_status(self):
                return None

        for signed_result in (
            {'aweme_id': '7674193013408681279', 'video': {}},
            IndexError('signer failed'),
        ):
            with self.subTest(signed_result=type(signed_result).__name__):
                signed_patch = (
                    patch.object(
                        self.downloader,
                        '_get_douyin_signed_detail',
                        side_effect=signed_result,
                    )
                    if isinstance(signed_result, Exception)
                    else patch.object(
                        self.downloader,
                        '_get_douyin_signed_detail',
                        return_value=signed_result,
                    )
                )
                with (
                    signed_patch,
                    patch.object(downloader_module, '_has_curl_cffi', False),
                    patch.object(
                        downloader_module.requests,
                        'get',
                        return_value=MobileResponse(),
                    ),
                ):
                    result = self.downloader._get_douyin_video_info(
                        'https://www.douyin.com/video/7674193013408681279'
                    )

                self.assertTrue(result['success'])
                self.assertEqual('Fallback', result['title'])
                self.assertEqual(
                    'https://cdn.example/play/video.mp4',
                    result['video_url'],
                )

    def test_douyin_signer_generates_the_expected_query_contract(self):
        fingerprint = BrowserFingerprintGenerator.generate_fingerprint('Edge')
        generated = ABogus(
            fp=fingerprint,
            user_agent='Mozilla/5.0 test',
        ).generate_abogus('aid=6383&aweme_id=7674193013408681279', '')

        self.assertTrue(fingerprint)
        self.assertEqual(4, len(generated))
        self.assertIn('aid=6383&aweme_id=7674193013408681279', generated[0])
        self.assertIn('&a_bogus=', generated[0])
        self.assertTrue(generated[1])

    def test_process_url_passes_the_clean_url_to_yt_dlp(self):
        info = {
            'success': True,
            'video_id': '1234567890',
            'title': 'Example',
            'author': 'Creator',
            'video_url': 'https://cdn.example/video.mp4',
            'cover_url': '',
            'duration': 1,
            'like_count': 0,
            'comment_count': 0,
            'view_count': 0,
        }
        with patch.object(self.downloader, 'get_video_info', return_value=info) as get_video_info:
            result = self.downloader.process_url(
                'Watch (HTTPS://www.twitch.tv/videos/1234567890)。'
            )

        self.assertTrue(result['success'])
        get_video_info.assert_called_once_with('https://www.twitch.tv/videos/1234567890')

    def test_browser_cookies_are_only_used_when_available_or_configured(self):
        with (
            patch.dict(os.environ, {}, clear=True),
            patch.object(self.downloader, '_local_chrome_profile_exists', return_value=False),
        ):
            self.assertEqual({}, self.downloader._cookie_options('instagram'))

        with (
            patch.dict(os.environ, {}, clear=True),
            patch.object(self.downloader, '_local_chrome_profile_exists', return_value=True),
        ):
            self.assertEqual(
                {'cookiesfrombrowser': ('chrome',)},
                self.downloader._cookie_options('instagram'),
            )

        cookie_file = Path(self.temp_dir.name) / 'cookies.txt'
        cookie_file.write_text('# Netscape HTTP Cookie File\n', encoding='utf-8')
        with patch.dict(
            os.environ,
            {
                'YTDLP_COOKIE_FILE': str(cookie_file),
                'YTDLP_COOKIES_FROM_BROWSER': 'off',
            },
            clear=True,
        ):
            self.assertEqual(
                {'cookiefile': str(cookie_file)},
                self.downloader._cookie_options('twitter'),
            )
            self.assertEqual(
                {'cookiefile': str(cookie_file)},
                self.downloader._cookie_options('youtube'),
            )

        with (
            patch.dict(
                os.environ,
                {'YTDLP_COOKIE_FILE': str(cookie_file.with_name('missing.txt'))},
                clear=True,
            ),
            patch.object(self.downloader, '_local_chrome_profile_exists', return_value=True),
        ):
            self.assertEqual({}, self.downloader._cookie_options('instagram'))

    def test_parser_errors_do_not_expose_internal_details(self):
        secret = '/srv/internal/session.sqlite'
        with self.assertLogs(downloader_module.logger, level='WARNING') as captured_logs:
            with (
                patch.dict(os.environ, {'YTDLP_COOKIES_FROM_BROWSER': 'off'}, clear=True),
                patch.object(
                    downloader_module.yt_dlp,
                    'YoutubeDL',
                    side_effect=RuntimeError(secret),
                ),
            ):
                result = self.downloader.get_video_info(
                    'https://www.youtube.com/watch?v=BaW_jenozKc'
                )

        self.assertFalse(result['success'])
        self.assertNotIn(secret, result['error'])
        self.assertNotIn(secret, '\n'.join(captured_logs.output))
        self.assertEqual(
            'Parsing failed. The platform may be temporarily unavailable',
            result['error'],
        )

    def test_telegram_large_media_has_an_actionable_error(self):
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value.extract_info.return_value = None
        fake_ydl.__exit__.return_value = None

        with patch.object(
            downloader_module.yt_dlp,
            'YoutubeDL',
            return_value=fake_ydl,
        ):
            result = self.downloader.get_video_info(
                'https://t.me/public_channel/12345'
            )

        self.assertFalse(result['success'])
        self.assertIn('Telegram 网页端未提供', result['error'])
        self.assertIn('请在 Telegram 中打开', result['error'])

    def test_real_subdomains_and_trailing_dot_are_accepted(self):
        accepted = {
            'https://m.youtube.com/watch?v=BaW_jenozKc': 'youtube',
            'https://www.youtube.com./watch?v=BaW_jenozKc': 'youtube',
            'https://clips.twitch.tv/ExampleClip': 'twitch',
            'https://www.pinterest.com.au/pin/123456789/': 'pinterest',
        }
        for url, expected_platform in accepted.items():
            with self.subTest(url=url):
                platform, _ = self.downloader.detect_platform(url)
                self.assertEqual(expected_platform, platform)

    def test_api_and_page_show_the_same_platform_count(self):
        client = app.test_client()
        response = client.get('/api/platforms')
        self.assertEqual(200, response.status_code)
        self.assertEqual(22, len(response.get_json()['platforms']))

        page_response = client.get('/')
        page = page_response.get_data(as_text=True)
        page_response.close()
        if 'class="platform-chip"' in page:
            self.assertEqual(22, len(re.findall(r'class="platform-chip"', page)))
            self.assertIn('22 platforms supported', page)
        else:
            self.assertIn('OmniMedia', page)

    def test_next_frontend_platform_registry_matches_backend(self):
        constants = (
            Path(__file__).parents[1] / 'frontend/src/lib/constants.ts'
        ).read_text(encoding='utf-8')
        frontend_keys = re.findall(r"^\s+key: '([^']+)'", constants, re.MULTILINE)

        self.assertEqual(22, len(frontend_keys))
        self.assertEqual(set(REPRESENTATIVE_URLS), set(frontend_keys))
        self.assertNotIn("'t.co'", constants)

        for domain in (
            'redditmedia.com',
            'redd.it',
            'vimeopro.com',
            'pinterest.co.uk',
        ):
            self.assertIn(f"'{domain}'", constants)

    def test_frontend_detection_uses_hostname_boundaries(self):
        api_source = (
            Path(__file__).parents[1] / 'frontend/src/lib/api.ts'
        ).read_text(encoding='utf-8')
        self.assertNotIn(
            'url.toLowerCase().includes(domain.toLowerCase())',
            api_source,
        )
        self.assertIn("hostname.endsWith(`.${normalizedDomain}`)", api_source)


if __name__ == '__main__':
    unittest.main()
