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


class ProfileParsingTests(unittest.TestCase):
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
