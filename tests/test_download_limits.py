import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import universal_downloader as downloader_module
from universal_downloader import UniversalDownloader


YOUTUBE_URL = 'https://www.youtube.com/watch?v=BaW_jenozKc'


class OversizedYoutubeDL:
    options = None

    def __init__(self, options):
        type(self).options = options
        self.options = options

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def download(self, _urls):
        output_path = self.options['outtmpl'].replace('%(ext)s', 'mp4')
        Path(output_path).write_bytes(b'12345')


class StreamingResponse:
    def __init__(self):
        self.headers = {}
        self.closed = False

    def raise_for_status(self):
        return None

    def iter_content(self, chunk_size=None):
        yield b'123'
        yield b'45'

    def close(self):
        self.closed = True


class StreamingSession:
    response = None
    request_kwargs = None

    def __init__(self, impersonate=None):
        type(self).response = StreamingResponse()

    def get(self, *_args, **kwargs):
        type(self).request_kwargs = kwargs
        return type(self).response


class DownloadLimitTests(unittest.TestCase):
    def test_yt_dlp_download_is_bounded_and_oversized_file_is_removed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            target = Path(temp_dir) / f'youtube_{"a" * 32}.mp4'

            with patch.object(
                downloader_module.yt_dlp,
                'YoutubeDL',
                OversizedYoutubeDL,
            ):
                result = downloader.download_video(
                    YOUTUBE_URL,
                    str(target),
                    max_bytes=4,
                )

            self.assertIsNone(result)
            self.assertEqual(4, OversizedYoutubeDL.options['max_filesize'])
            self.assertEqual(1, len(OversizedYoutubeDL.options['progress_hooks']))
            self.assertEqual(downloader.read_timeout, OversizedYoutubeDL.options['socket_timeout'])
            self.assertEqual(3, OversizedYoutubeDL.options['extractor_retries'])
            self.assertEqual([], list(Path(temp_dir).iterdir()))

    def test_douyin_stream_is_stopped_and_removed_at_size_limit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            target = Path(temp_dir) / f'douyin_{"b" * 32}.mp4'
            info = {
                'success': True,
                'video_url': 'https://example.invalid/video.mp4',
            }

            if downloader_module._has_curl_cffi:
                request_patch = patch.object(
                    downloader_module.cffi_requests,
                    'Session',
                    StreamingSession,
                )
                response = None
            else:
                response = StreamingResponse()
                request_patch = patch.object(
                    downloader_module.requests,
                    'get',
                    return_value=response,
                )

            with (
                patch.object(downloader, '_get_douyin_video_info', return_value=info),
                request_patch,
            ):
                result = downloader.download_video(
                    'https://www.douyin.com/video/1234567890123456789',
                    str(target),
                    max_bytes=4,
                )

            self.assertIsNone(result)
            actual_response = response or StreamingSession.response
            self.assertTrue(actual_response.closed)
            if downloader_module._has_curl_cffi:
                self.assertEqual(
                    (downloader.connect_timeout, downloader.download_timeout),
                    StreamingSession.request_kwargs['timeout'],
                )
            self.assertEqual([], list(Path(temp_dir).iterdir()))


if __name__ == '__main__':
    unittest.main()
