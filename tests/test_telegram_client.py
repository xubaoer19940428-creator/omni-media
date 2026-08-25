import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import telegram_client
import universal_downloader as downloader_module
from universal_downloader import UniversalDownloader


PUBLIC_POST = 'https://t.me/sllkzb/448'


class FakeTelegramClient:
    authorized = True
    message = None
    download_error = None
    download_called = False

    def __init__(self, *_args):
        pass

    async def connect(self):
        return None

    async def disconnect(self):
        return None

    async def is_user_authorized(self):
        return type(self).authorized

    async def get_entity(self, _username):
        return SimpleNamespace(title='Public channel', username='sllkzb')

    async def get_messages(self, _entity, ids):
        return type(self).message if ids == 448 else None

    async def download_media(self, _message, file, progress_callback):
        type(self).download_called = True
        Path(file).write_bytes(b'partial')
        progress_callback(7, 7)
        if type(self).download_error:
            raise type(self).download_error
        return file


class TelegramClientTests(unittest.TestCase):
    def test_accepts_only_public_username_post_links(self):
        self.assertEqual(('sllkzb', 448), telegram_client.parse_public_post_url(PUBLIC_POST))
        self.assertEqual(
            ('public_channel', 123),
            telegram_client.parse_public_post_url('https://t.me/s/public_channel/123'),
        )

        rejected = (
            'http://t.me/sllkzb/448',
            'https://telegram.me/sllkzb/448',
            'https://t.me./sllkzb/448',
            'https://user:pass@t.me/sllkzb/448',
            'https://t.me:444/sllkzb/448',
            'https://t.me/sllkzb/448?single',
            'https://t.me/sllkzb/448#media',
            'https://t.me/c/123456/448',
            'https://t.me/+privateInvite',
            'https://t.me/joinchat/privateInvite',
            'https://example.com/sllkzb/448',
        )
        for url in rejected:
            with self.subTest(url=url):
                with self.assertRaises(telegram_client.TelegramMediaError):
                    telegram_client.parse_public_post_url(url)

    def test_feature_is_disabled_without_all_secrets(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(telegram_client.is_configured())

    def test_configured_fallback_does_not_rewrite_noncanonical_links(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            with (
                patch.object(
                    downloader_module.telegram_client,
                    'is_configured',
                    return_value=True,
                ),
                patch.object(
                    downloader_module.telegram_client,
                    'get_video_info',
                    side_effect=lambda url: telegram_client.parse_public_post_url(url),
                ) as get_info,
                patch.object(
                    downloader_module.telegram_client,
                    'download_video',
                    side_effect=lambda url, *_args: telegram_client.parse_public_post_url(url),
                ) as download,
            ):
                extracted = downloader.extract_url_from_text(
                    'Watch http://telegram.me/public_channel/123'
                )
                parsed = downloader.process_url(extracted)
                downloaded = downloader.download_video(
                    extracted,
                    str(Path(temp_dir) / f'telegram_{"a" * 32}.mp4'),
                    max_bytes=10,
                )

        self.assertEqual('http://telegram.me/public_channel/123', extracted)
        self.assertFalse(parsed['success'])
        self.assertIsNone(downloaded)
        get_info.assert_called_once_with(extracted)
        download.assert_called_once()

    def test_downloader_uses_configured_telegram_metadata_fallback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            info = {
                'success': True,
                'platform': 'telegram',
                'platform_name': 'Telegram',
                'video_id': '448',
                'title': 'Public Telegram video',
                'author': 'Public channel',
                'video_url': '',
                'cover_url': '',
                'duration': 60,
            }
            with (
                patch.object(downloader_module.telegram_client, 'is_configured', return_value=True),
                patch.object(downloader_module.telegram_client, 'get_video_info', return_value=info) as get_info,
            ):
                result = downloader.get_video_info(PUBLIC_POST)

            self.assertEqual(info, result)
            get_info.assert_called_once_with(PUBLIC_POST)

    def test_downloader_uses_configured_telegram_download_fallback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            target = Path(temp_dir) / f'telegram_{"a" * 32}.mp4'

            def fake_download(_url, filepath, _max_bytes):
                Path(filepath).write_bytes(b'video')
                return filepath

            with (
                patch.object(downloader_module.telegram_client, 'is_configured', return_value=True),
                patch.object(
                    downloader_module.telegram_client,
                    'download_video',
                    side_effect=fake_download,
                ) as download,
            ):
                result = downloader.download_video(PUBLIC_POST, str(target), max_bytes=10)

            self.assertEqual(target.name, result)
            download.assert_called_once_with(PUBLIC_POST, str(target), 10)
            self.assertEqual(b'video', target.read_bytes())

    def test_authorization_state_is_not_exposed_by_public_parser(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            downloader = UniversalDownloader(temp_dir)
            with (
                patch.object(downloader_module.telegram_client, 'is_configured', return_value=True),
                patch.object(
                    downloader_module.telegram_client,
                    'get_video_info',
                    side_effect=telegram_client.TelegramMediaError(
                        'The Telegram session is no longer authorized'
                    ),
                ),
            ):
                result = downloader.get_video_info(PUBLIC_POST)

        self.assertFalse(result['success'])
        self.assertEqual('Telegram could not parse this public video', result['error'])
        self.assertNotIn('session', result['error'].lower())

    def test_telethon_metadata_path_requires_authorized_video(self):
        message = SimpleNamespace(
            id=448,
            message='Public Telegram video',
            media=object(),
            video=object(),
            file=SimpleNamespace(
                mime_type='video/mp4', size=7, ext='.mp4', duration=60,
            ),
        )
        secrets = {
            'TELEGRAM_API_ID': '12345',
            'TELEGRAM_API_HASH': 'hash',
            'TELEGRAM_SESSION': 'session',
        }
        FakeTelegramClient.authorized = True
        FakeTelegramClient.message = message
        with (
            patch.dict(os.environ, secrets, clear=True),
            patch.object(telegram_client, 'TelegramClient', FakeTelegramClient),
            patch.object(telegram_client, 'StringSession', side_effect=lambda value: value),
        ):
            info = telegram_client.get_video_info(PUBLIC_POST)

        self.assertTrue(info['success'])
        self.assertEqual('448', info['video_id'])
        self.assertEqual('', info['video_url'])

        FakeTelegramClient.authorized = False
        with (
            patch.dict(os.environ, secrets, clear=True),
            patch.object(telegram_client, 'TelegramClient', FakeTelegramClient),
            patch.object(telegram_client, 'StringSession', side_effect=lambda value: value),
        ):
            with self.assertRaisesRegex(telegram_client.TelegramMediaError, 'authorized'):
                telegram_client.get_video_info(PUBLIC_POST)

    def test_telethon_download_prechecks_size_and_cleans_partial_files(self):
        message = SimpleNamespace(
            id=448,
            message='Public Telegram video',
            media=object(),
            video=object(),
            file=SimpleNamespace(
                mime_type='video/mp4', size=20, ext='.mp4', duration=60,
            ),
        )
        secrets = {
            'TELEGRAM_API_ID': '12345',
            'TELEGRAM_API_HASH': 'hash',
            'TELEGRAM_SESSION': 'session',
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / 'telegram.mp4'
            FakeTelegramClient.authorized = True
            FakeTelegramClient.message = message
            FakeTelegramClient.download_called = False
            with (
                patch.dict(os.environ, secrets, clear=True),
                patch.object(telegram_client, 'TelegramClient', FakeTelegramClient),
                patch.object(telegram_client, 'StringSession', side_effect=lambda value: value),
            ):
                with self.assertRaisesRegex(telegram_client.TelegramMediaError, 'size limit'):
                    telegram_client.download_video(PUBLIC_POST, str(target), 10)
            self.assertFalse(FakeTelegramClient.download_called)
            self.assertFalse(target.exists())

            message.file.size = 7
            FakeTelegramClient.download_error = RuntimeError('network failed')
            with (
                patch.dict(os.environ, secrets, clear=True),
                patch.object(telegram_client, 'TelegramClient', FakeTelegramClient),
                patch.object(telegram_client, 'StringSession', side_effect=lambda value: value),
            ):
                with self.assertRaisesRegex(telegram_client.TelegramMediaError, 'could not download'):
                    telegram_client.download_video(PUBLIC_POST, str(target), 10)
            self.assertFalse(target.exists())
            FakeTelegramClient.download_error = None


if __name__ == '__main__':
    unittest.main()
