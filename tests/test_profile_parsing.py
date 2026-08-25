import tempfile
import unittest
from unittest.mock import patch

import universal_downloader as downloader_module
from universal_downloader import UniversalDownloader


PROFILE_URL = 'https://www.youtube.com/@example/videos'


class FakeProfileYoutubeDL:
    options = None

    def __init__(self, options):
        type(self).options = options

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def extract_info(self, url, download=False):
        assert url == PROFILE_URL
        assert download is False
        return {
            '_type': 'playlist',
            'id': 'UC-example',
            'title': 'Example creator - Videos',
            'channel': 'Example creator',
            'channel_id': 'UC-example',
            'channel_follower_count': 1234,
            'playlist_count': 20,
            'thumbnail': 'https://images.example/avatar.jpg',
            'entries': [
                {
                    'id': 'video-1',
                    'title': 'First public video',
                    'url': 'https://www.youtube.com/watch?v=video-1',
                    'thumbnail': 'https://images.example/one.jpg',
                    'duration': 42,
                    'view_count': 100,
                },
                {
                    'id': 'video-2',
                    'title': 'Second public video',
                    'webpage_url': 'https://www.youtube.com/watch?v=video-2',
                    'thumbnail': 'https://images.example/two.jpg',
                    'duration': 17,
                },
                {
                    'id': 'external',
                    'title': 'External URL must not escape the registry',
                    'url': 'https://example.com/video',
                },
            ],
        }


class EmptyProfileYoutubeDL(FakeProfileYoutubeDL):
    def extract_info(self, url, download=False):
        return {'id': 'single-video', 'title': 'Not a profile'}


class FakeTikTokProfileYoutubeDL(FakeProfileYoutubeDL):
    def extract_info(self, url, download=False):
        return {
            '_type': 'playlist',
            'id': 'creator-1',
            'title': 'creator',
            'entries': [{
                'id': 'video-1',
                'title': 'Public video',
                'url': 'https://www.tiktok.com/@creator/video/1',
            }],
        }


class ProfileParsingTests(unittest.TestCase):
    def test_profile_summary_normalizes_cross_platform_extractor_fields(self):
        profile = UniversalDownloader._normalized_profile_summary(
            {
                'id': 'profile-1',
                'creator': 'Example creator',
                'bio': 'Public bio',
                'follower_count': '1200',
                'following_count': 42,
                'heart_count': '9000',
                'media_count': 87,
                'external_url': 'https://example.com',
                'is_verified': True,
            },
            'instagram',
            'Instagram',
            'https://www.instagram.com/example.creator/',
        )

        self.assertEqual('Example creator', profile['name'])
        self.assertEqual('example.creator', profile['handle'])
        self.assertEqual(1200, profile['followers'])
        self.assertEqual(42, profile['following'])
        self.assertEqual(9000, profile['likes'])
        self.assertEqual(87, profile['posts'])
        self.assertEqual('https://example.com', profile['website'])
        self.assertTrue(profile['verified'])

    def test_tiktok_profile_page_metadata_is_normalized(self):
        page_data = {
            '__DEFAULT_SCOPE__': {
                'webapp.user-detail': {
                    'userInfo': {
                        'user': {
                            'id': 'creator-1',
                            'uniqueId': 'hyz00_',
                            'nickname': 'Hyunji',
                            'avatarLarger': 'https://images.example/avatar.jpg',
                            'signature': 'Public bio',
                            'bioLink': {'link': 'https://example.com/creator'},
                            'verified': True,
                        },
                        'statsV2': {
                            'followerCount': '526869',
                            'followingCount': '97',
                            'heartCount': '23870495',
                            'videoCount': '497',
                            'friendCount': '55',
                        },
                    },
                },
            },
        }
        page_html = (
            '<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" '
            f'type="application/json">{downloader_module.json.dumps(page_data)}</script>'
        )

        profile = UniversalDownloader._tiktok_profile_from_html(page_html)

        self.assertEqual('Hyunji', profile['name'])
        self.assertEqual('hyz00_', profile['handle'])
        self.assertEqual(526869, profile['followers'])
        self.assertEqual(97, profile['following'])
        self.assertEqual(23870495, profile['likes'])
        self.assertEqual(497, profile['posts'])
        self.assertEqual('https://example.com/creator', profile['website'])
        self.assertTrue(profile['verified'])

    def test_tiktok_profile_metadata_accepts_trailing_slash(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
        self.assertTrue(downloader.is_profile_url('https://www.tiktok.com/@creator/'))

    def test_partial_enrichment_does_not_erase_existing_profile_data(self):
        result = UniversalDownloader._merge_profile_enrichment(
            {
                'name': 'Existing creator',
                'avatar': 'https://images.example/avatar.jpg',
                'followers': 1200,
                'verified': True,
            },
            {
                'name': '',
                'avatar': '',
                'followers': 0,
                'following': 42,
                'verified': False,
            },
        )

        self.assertEqual('Existing creator', result['name'])
        self.assertEqual('https://images.example/avatar.jpg', result['avatar'])
        self.assertEqual(1200, result['followers'])
        self.assertEqual(42, result['following'])
        self.assertTrue(result['verified'])

    def test_profile_pagination_skips_optional_platform_enrichment(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            with (
                patch.object(
                    downloader_module.yt_dlp,
                    'YoutubeDL',
                    FakeTikTokProfileYoutubeDL,
                ),
                patch.object(
                    downloader,
                    '_get_platform_profile_metadata',
                ) as enrich,
            ):
                result = downloader.get_profile_info(
                    'https://www.tiktok.com/@creator',
                    limit=1,
                    cursor=12,
                )

        self.assertTrue(result['success'])
        enrich.assert_not_called()

    def test_best_thumbnail_uses_largest_array_candidate(self):
        result = UniversalDownloader._best_thumbnail({
            'thumbnail': None,
            'thumbnails': [
                {'url': 'https://images.example/small.jpg', 'width': 320, 'height': 180},
                {'url': 'https://images.example/large.jpg', 'width': 1280, 'height': 720},
            ],
        })
        self.assertEqual('https://images.example/large.jpg', result)

    def test_profile_url_classifier_rejects_media_and_playlist_urls(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)

        self.assertTrue(downloader.is_profile_url(PROFILE_URL))
        self.assertTrue(downloader.is_profile_url('https://www.tiktok.com/@creator'))
        self.assertFalse(downloader.is_profile_url('https://www.youtube.com/watch?v=abc'))
        self.assertFalse(downloader.is_profile_url('https://www.youtube.com/playlist?list=abc'))
        self.assertFalse(downloader.is_profile_url('https://www.tiktok.com/@creator/video/1'))
        self.assertFalse(downloader.is_profile_url('https://v.douyin.com/short-link'))
        self.assertFalse(downloader.is_profile_url('https://t.me/channel/123'))
        self.assertFalse(downloader.is_profile_url('https://rumble.com/v123-example.html'))
        self.assertFalse(downloader.is_profile_url('https://www.tumblr.com/user/post/123'))
        self.assertFalse(downloader.is_profile_url('https://space.bilibili.com/123/medialist/play/1'))
        self.assertFalse(downloader.is_profile_url('https://x.com/i/lists/123'))
        self.assertTrue(downloader.is_profile_url('https://space.bilibili.com/123/video'))
        self.assertTrue(downloader.is_profile_url('https://creator.tumblr.com/'))
        self.assertFalse(downloader.is_profile_url('https://www.facebook.com/photo.php?fbid=123'))
        self.assertFalse(downloader.is_profile_url('https://www.facebook.com/video.php?v=123'))

    def test_profile_parse_is_bounded_and_filters_external_entries(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            with patch.object(
                downloader_module.yt_dlp,
                'YoutubeDL',
                FakeProfileYoutubeDL,
            ):
                result = downloader.get_profile_info(PROFILE_URL, limit=2, cursor=4)

        self.assertTrue(result['success'])
        self.assertEqual('youtube', result['platform_key'])
        self.assertEqual('Example creator', result['profile']['name'])
        self.assertEqual(2, result['count'])
        self.assertEqual(2, len(result['items']))
        self.assertTrue(result['has_more'])
        self.assertEqual('6', result['next_cursor'])
        self.assertEqual(5, FakeProfileYoutubeDL.options['playliststart'])
        self.assertEqual(7, FakeProfileYoutubeDL.options['playlistend'])
        self.assertEqual('in_playlist', FakeProfileYoutubeDL.options['extract_flat'])

    def test_single_media_result_is_not_reported_as_a_profile(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            with patch.object(
                downloader_module.yt_dlp,
                'YoutubeDL',
                EmptyProfileYoutubeDL,
            ):
                result = downloader.get_profile_info(PROFILE_URL)

        self.assertFalse(result['success'])
        self.assertIn('not a public creator profile', result['error'])


if __name__ == '__main__':
    unittest.main()
