import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import app as app_module
from storage import PublishedObject, StoragePublishError


YOUTUBE_URL = 'https://www.youtube.com/watch?v=BaW_jenozKc'
INSTAGRAM_IMAGE_URL = 'https://scontent.cdninstagram.com/example.jpg'


class BusyDownloadSlots:
    def acquire(self, blocking=False):
        return False

    def release(self):
        raise AssertionError('A slot that was not acquired must not be released')


class ApiSecurityTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.download_dir = Path(self.temp_dir.name) / 'downloads'
        self.download_dir.mkdir()
        self.download_dir_patch = patch.object(
            app_module, 'DOWNLOAD_DIR', str(self.download_dir)
        )
        self.download_dir_patch.start()
        app_module._rate_limit_state.clear()
        app_module._last_cleanup_check = -float('inf')
        app_module.app.config.update(TESTING=True)
        self.client = app_module.app.test_client()

    def tearDown(self):
        self.download_dir_patch.stop()
        self.temp_dir.cleanup()

    def test_download_uses_server_generated_filename_and_hides_internal_path(self):
        captured = {}

        def fake_download(url, filename, max_bytes=None):
            captured.update(url=url, filename=filename, max_bytes=max_bytes)
            Path(filename).write_bytes(b'video')
            return os.path.basename(filename)

        with patch.object(
            app_module.downloader, 'download_video', side_effect=fake_download
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
                'platform': '../../attacker',
                'video_id': '../../outside',
            })

        self.assertEqual(200, response.status_code)
        data = response.get_json()
        self.assertRegex(data['filename'], r'^youtube_[0-9a-f]{32}\.mp4$')
        self.assertEqual(
            self.download_dir.resolve(),
            Path(captured['filename']).parent.resolve(),
        )
        self.assertEqual(YOUTUBE_URL, captured['url'])
        self.assertEqual(app_module.MAX_DOWNLOAD_BYTES, captured['max_bytes'])
        self.assertNotIn('filepath', data)
        self.assertEqual(f"/download/{data['filename']}", data['download_url'])

    def test_r2_publication_returns_signed_url_and_removes_local_file(self):
        published_path = None

        def fake_download(_url, filename, max_bytes=None):
            nonlocal published_path
            published_path = Path(filename)
            published_path.write_bytes(b'video')
            return published_path.name

        storage = Mock()
        storage.publish.return_value = PublishedObject(
            download_url='https://signed.example/video',
            filename=f'youtube_{"a" * 32}.mp4',
            expires_in=600,
            remove_local_file=True,
        )
        with (
            patch.object(app_module.downloader, 'download_video', side_effect=fake_download),
            patch.object(app_module, 'storage_backend', storage),
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
            })

        self.assertEqual(200, response.status_code)
        self.assertEqual('https://signed.example/video', response.get_json()['download_url'])
        self.assertEqual(600, response.get_json()['expires_in'])
        self.assertFalse(published_path.exists())

    def test_r2_publication_failure_removes_local_file(self):
        published_path = None

        def fake_download(_url, filename, max_bytes=None):
            nonlocal published_path
            published_path = Path(filename)
            published_path.write_bytes(b'video')
            return published_path.name

        storage = Mock()
        storage.publish.side_effect = StoragePublishError('upload failed')
        with (
            patch.object(app_module.downloader, 'download_video', side_effect=fake_download),
            patch.object(app_module, 'storage_backend', storage),
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
            })

        self.assertEqual(503, response.status_code)
        self.assertFalse(published_path.exists())

    def test_parse_rejects_non_object_json(self):
        response = self.client.post('/api/parse', json=['not', 'an', 'object'])
        self.assertEqual(400, response.status_code)

    def test_parse_rate_limit_returns_429(self):
        parsed = {'success': True, 'video_info': {}}
        with (
            patch.object(app_module, 'PARSE_RATE_LIMIT', 2),
            patch.object(app_module.downloader, 'process_url', return_value=parsed),
        ):
            first = self.client.post('/api/parse', json={'url': YOUTUBE_URL})
            second = self.client.post('/api/parse', json={'url': YOUTUBE_URL})
            third = self.client.post('/api/parse', json={'url': YOUTUBE_URL})

        self.assertEqual(200, first.status_code)
        self.assertEqual(200, second.status_code)
        self.assertEqual(429, third.status_code)

    def test_parse_response_exposes_flat_frontend_contract(self):
        parsed = {
            'success': True,
            'platform': 'youtube',
            'video_info': {
                'title': 'Example',
                'author': 'Creator',
                'video_url': 'https://cdn.example/video.mp4',
                'cover_url': 'https://cdn.example/cover.jpg',
                'duration': 12,
                'like_count': 3,
                'view_count': 4,
                'comment_count': 5,
            },
        }
        with patch.object(app_module.downloader, 'process_url', return_value=parsed):
            response = self.client.post('/api/parse', json={'url': YOUTUBE_URL})

        self.assertEqual(200, response.status_code)
        data = response.get_json()
        self.assertEqual(YOUTUBE_URL, data['original_url'])
        self.assertEqual('youtube', data['platform_key'])
        self.assertEqual('Example', data['title'])
        self.assertEqual('https://cdn.example/video.mp4', data['video_url'])
        self.assertEqual(4, data['views'])

    def test_request_id_is_generated_or_accepts_a_safe_caller_value(self):
        generated = self.client.get('/api/health')
        supplied = self.client.get(
            '/api/health',
            headers={'X-Request-ID': 'client_request-123'},
        )
        rejected = self.client.get(
            '/api/health',
            headers={'X-Request-ID': 'unsafe request id'},
        )

        self.assertRegex(generated.headers['X-Request-ID'], r'^[0-9a-f]{32}$')
        self.assertEqual('client_request-123', supplied.headers['X-Request-ID'])
        self.assertNotEqual('unsafe request id', rejected.headers['X-Request-ID'])
        self.assertIn(
            'X-Request-ID',
            generated.headers['Access-Control-Expose-Headers'],
        )

    def test_parse_timing_log_omits_source_and_media_urls(self):
        sensitive_source = f'{YOUTUBE_URL}&signature=do-not-log'
        sensitive_media = 'https://cdn.example/video.mp4?token=do-not-log'
        parsed = {
            'success': True,
            'platform': 'youtube',
            'video_info': {'video_url': sensitive_media},
        }
        with (
            patch.object(app_module.downloader, 'process_url', return_value=parsed),
            self.assertLogs(level='INFO') as captured,
        ):
            response = self.client.post('/api/parse', json={'url': sensitive_source})

        logs = '\n'.join(captured.output)
        self.assertEqual(200, response.status_code)
        self.assertIn('stage=parse', logs)
        self.assertIn('stage=request_total', logs)
        self.assertIn('platform=youtube', logs)
        self.assertNotIn(sensitive_source, logs)
        self.assertNotIn(sensitive_media, logs)

    def test_parse_and_batch_timing_logs_survive_unexpected_failures(self):
        with (
            patch.object(app_module, '_parse_media', side_effect=RuntimeError('boom')),
            self.assertLogs(level='INFO') as parse_logs,
            self.assertRaises(RuntimeError),
        ):
            self.client.post('/api/parse', json={'url': YOUTUBE_URL})

        with (
            patch.object(app_module, '_parse_media', side_effect=RuntimeError('boom')),
            self.assertLogs(level='INFO') as batch_logs,
            self.assertRaises(RuntimeError),
        ):
            self.client.post('/api/batch-parse', json={'urls': [YOUTUBE_URL]})

        self.assertIn('stage=parse', '\n'.join(parse_logs.output))
        self.assertIn('status=failed', '\n'.join(parse_logs.output))
        self.assertIn('stage=batch_parse', '\n'.join(batch_logs.output))
        self.assertIn('status=failed', '\n'.join(batch_logs.output))

    def test_storage_timing_log_survives_unexpected_backend_failure(self):
        def fake_download(_url, filename, max_bytes=None):
            path = Path(filename)
            path.write_bytes(b'video')
            return path.name

        storage = Mock(name='r2')
        storage.name = 'r2'
        storage.publish.side_effect = RuntimeError('boom')
        with (
            patch.object(app_module.downloader, 'download_video', side_effect=fake_download),
            patch.object(app_module, 'storage_backend', storage),
            self.assertLogs(level='INFO') as captured,
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
            })

        logs = '\n'.join(captured.output)
        self.assertEqual(500, response.status_code)
        self.assertIn('stage=storage_publish', logs)
        self.assertIn('status=failed', logs)

    def test_batch_parse_is_bounded_and_preserves_results(self):
        urls = [YOUTUBE_URL, 'https://example.com/video']
        parsed = {
            'success': True,
            'platform': 'youtube',
            'video_info': {'title': 'Example'},
        }
        with patch.object(app_module.downloader, 'process_url', return_value=parsed):
            response = self.client.post('/api/batch-parse', json={'urls': urls})

        self.assertEqual(200, response.status_code)
        data = response.get_json()
        self.assertEqual(2, data['total'])
        self.assertTrue(data['results'][0]['success'])
        self.assertEqual(YOUTUBE_URL, data['results'][0]['original_url'])
        self.assertFalse(data['results'][1]['success'])
        self.assertEqual('This platform is not supported', data['results'][1]['error'])

        with patch.object(app_module, 'MAX_BATCH_SIZE', 1):
            oversized = self.client.post('/api/batch-parse', json={'urls': urls})
        self.assertEqual(400, oversized.status_code)

    def test_batch_parse_has_a_hard_ten_url_ceiling(self):
        urls = [YOUTUBE_URL] * 11
        response = self.client.post('/api/batch-parse', json={'urls': urls})

        self.assertEqual(400, response.status_code)
        self.assertIn('maximum of 10', response.get_json()['error'])

    def test_batch_size_environment_cannot_raise_hard_ceiling(self):
        env = {**os.environ, 'MAX_BATCH_SIZE': '99'}
        output = subprocess.check_output(
            [sys.executable, '-c', 'import app; print(app.MAX_BATCH_SIZE)'],
            cwd=Path(__file__).parents[1],
            env=env,
            text=True,
        )
        self.assertEqual('10', output.strip())

    def test_cors_only_echoes_configured_origins(self):
        with patch.object(
            app_module,
            'CORS_ALLOWED_ORIGINS',
            {'https://app.example'},
        ):
            allowed = self.client.get(
                '/api/health',
                headers={'Origin': 'https://app.example'},
            )
            rejected = self.client.get(
                '/api/health',
                headers={'Origin': 'https://evil.example'},
            )

        self.assertEqual(
            'https://app.example',
            allowed.headers['Access-Control-Allow-Origin'],
        )
        self.assertNotIn('Access-Control-Allow-Origin', rejected.headers)

    def test_cors_preflight_only_allows_configured_origins(self):
        with patch.object(
            app_module,
            'CORS_ALLOWED_ORIGINS',
            {'https://app.example'},
        ):
            allowed = self.client.options(
                '/api/parse',
                headers={
                    'Origin': 'https://app.example',
                    'Access-Control-Request-Method': 'POST',
                },
            )
            rejected = self.client.options(
                '/api/parse',
                headers={
                    'Origin': 'https://evil.example',
                    'Access-Control-Request-Method': 'POST',
                },
            )

        self.assertEqual(204, allowed.status_code)
        self.assertEqual(
            'https://app.example',
            allowed.headers['Access-Control-Allow-Origin'],
        )
        self.assertIn('POST', allowed.headers['Access-Control-Allow-Methods'])
        self.assertEqual(204, rejected.status_code)
        self.assertNotIn('Access-Control-Allow-Origin', rejected.headers)

    def test_frontend_asset_route_cannot_escape_export_directory(self):
        with tempfile.TemporaryDirectory() as frontend_dir:
            frontend_path = Path(frontend_dir)
            (frontend_path / 'asset.js').write_text('safe', encoding='utf-8')
            outside = frontend_path.parent / 'private'
            outside.mkdir(exist_ok=True)
            (outside / 'index.html').write_text('private', encoding='utf-8')

            with patch.object(app_module, 'FRONTEND_DIR', frontend_path.resolve()):
                safe = self.client.get('/asset.js')
                escaped = self.client.get('/..%2Fprivate/')

            safe_status = safe.status_code
            escaped_status = escaped.status_code
            escaped_data = escaped.get_data()
            safe.close()
            escaped.close()

        self.assertEqual(200, safe_status)
        self.assertEqual(404, escaped_status)
        self.assertNotIn(b'private', escaped_data)

    def test_download_rejects_unsupported_url_before_downloading(self):
        with patch.object(app_module.downloader, 'download_video') as download_video:
            response = self.client.post('/api/download', json={
                'original_url': 'https://example.com/video',
                'video_id': '123',
            })

        self.assertEqual(400, response.status_code)
        download_video.assert_not_called()

    def test_download_rejects_a_different_existing_cache_file(self):
        unrelated = self.download_dir / f'youtube_{"e" * 32}.mp4'
        unrelated.write_bytes(b'unrelated')
        with patch.object(
            app_module.downloader,
            'download_video',
            return_value=unrelated.name,
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
                'video_id': '123',
            })

        self.assertEqual(500, response.status_code)
        self.assertTrue(unrelated.exists())

    def test_download_rejects_non_object_json(self):
        response = self.client.post('/api/download', json=['not', 'an', 'object'])
        self.assertEqual(400, response.status_code)

    def test_api_rejects_oversized_request_body(self):
        body = '{"original_url":"' + ('x' * (64 * 1024)) + '"}'
        response = self.client.post(
            '/api/download',
            data=body,
            content_type='application/json',
        )
        self.assertEqual(413, response.status_code)

    def test_download_returns_429_when_all_download_slots_are_busy(self):
        with (
            patch.object(app_module, '_download_slots', BusyDownloadSlots()),
            patch.object(app_module.downloader, 'download_video') as download_video,
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
                'video_id': '123',
            })

        self.assertEqual(429, response.status_code)
        download_video.assert_not_called()

    def test_download_returns_507_when_storage_is_low(self):
        disk_usage = Mock(free=0)
        with (
            patch.object(app_module.shutil, 'disk_usage', return_value=disk_usage),
            patch.object(app_module.downloader, 'download_video') as download_video,
        ):
            response = self.client.post('/api/download', json={
                'original_url': YOUTUBE_URL,
                'video_id': '123',
            })

        self.assertEqual(507, response.status_code)
        download_video.assert_not_called()

    def test_expired_generated_downloads_are_removed(self):
        expired = self.download_dir / f'youtube_{"c" * 32}.mp4'
        current = self.download_dir / f'youtube_{"d" * 32}.mp4'
        expired.write_bytes(b'expired')
        current.write_bytes(b'current')
        old_time = time.time() - 120
        os.utime(expired, (old_time, old_time))

        with patch.object(app_module, 'DOWNLOAD_TTL_SECONDS', 60):
            app_module._remove_expired_downloads()

        self.assertFalse(expired.exists())
        self.assertTrue(current.exists())

    def test_regular_requests_trigger_throttled_expired_file_cleanup(self):
        expired = self.download_dir / f'youtube_{"f" * 32}.mp4'
        expired.write_bytes(b'expired')
        old_time = time.time() - 120
        os.utime(expired, (old_time, old_time))

        with (
            patch.object(app_module, 'DOWNLOAD_TTL_SECONDS', 60),
            patch.object(app_module, 'CLEANUP_INTERVAL_SECONDS', 60),
        ):
            response = self.client.get('/api/platforms')

        self.assertEqual(200, response.status_code)
        self.assertFalse(expired.exists())

    def test_security_headers_include_csp_and_https_hsts(self):
        with patch.object(
            app_module,
            'FRONTEND_SCRIPT_HASHES',
            ("'sha256-test-inline-script-hash='",),
        ):
            response = self.client.get('/', base_url='https://quickclean.example')

        self.assertEqual(200, response.status_code)
        self.assertIn("default-src 'self'", response.headers['Content-Security-Policy'])
        self.assertNotIn("script-src 'self' 'unsafe-inline'", response.headers['Content-Security-Policy'])
        self.assertIn(
            "script-src 'self' 'sha256-test-inline-script-hash='",
            response.headers['Content-Security-Policy'],
        )
        self.assertEqual(
            'max-age=31536000',
            response.headers['Strict-Transport-Security'],
        )
        response.close()

    def test_cleanup_rejects_path_traversal(self):
        victim = Path(self.temp_dir.name) / 'victim.txt'
        victim.write_text('keep me', encoding='utf-8')

        response = self.client.post('/api/cleanup', json={
            'filename': '../victim.txt',
        })

        self.assertEqual(400, response.status_code)
        self.assertTrue(victim.exists())

    def test_cleanup_rejects_symlink_to_file_outside_download_directory(self):
        victim = Path(self.temp_dir.name) / 'victim.mp4'
        victim.write_bytes(b'keep me')
        link = self.download_dir / f'youtube_{"a" * 32}.mp4'
        link.symlink_to(victim)

        response = self.client.post('/api/cleanup', json={
            'filename': link.name,
        })

        self.assertEqual(400, response.status_code)
        self.assertTrue(victim.exists())

    def test_cleanup_deletes_valid_generated_file(self):
        cached_file = self.download_dir / f'youtube_{"a" * 32}.mp4'
        cached_file.write_bytes(b'cached video')

        response = self.client.post('/api/cleanup', json={
            'filename': cached_file.name,
        })

        self.assertEqual(200, response.status_code)
        self.assertFalse(cached_file.exists())

    def test_file_route_rejects_symlink(self):
        victim = Path(self.temp_dir.name) / 'victim.mp4'
        victim.write_bytes(b'private file')
        link = self.download_dir / f'youtube_{"b" * 32}.mp4'
        link.symlink_to(victim)

        response = self.client.get(f'/download/{link.name}')

        self.assertEqual(404, response.status_code)
        self.assertNotIn(b'private file', response.data)

    def test_image_proxy_rejects_unapproved_hostname(self):
        with patch.object(app_module._image_session, 'get') as image_get:
            response = self.client.get(
                '/api/proxy-image?url=https://cdninstagram.com.evil.example/image.jpg'
            )

        self.assertEqual(400, response.status_code)
        image_get.assert_not_called()

    def test_image_proxy_rejects_hostname_resolving_to_private_ip(self):
        private_result = [(2, 1, 6, '', ('127.0.0.1', 443))]
        with (
            patch.object(app_module.socket, 'getaddrinfo', return_value=private_result),
            patch.object(app_module._image_session, 'get') as image_get,
        ):
            response = self.client.get(
                f'/api/proxy-image?url={INSTAGRAM_IMAGE_URL}'
            )

        self.assertEqual(400, response.status_code)
        image_get.assert_not_called()

    def test_image_proxy_revalidates_redirect_destination(self):
        redirect = Mock(
            status_code=302,
            headers={'Location': 'http://127.0.0.1/private'},
        )
        redirect.close = Mock()
        public_result = [(2, 1, 6, '', ('8.8.8.8', 443))]

        with (
            patch.object(app_module.socket, 'getaddrinfo', return_value=public_result),
            patch.object(app_module._image_session, 'get', return_value=redirect),
        ):
            response = self.client.get(
                f'/api/proxy-image?url={INSTAGRAM_IMAGE_URL}'
            )

        self.assertEqual(400, response.status_code)
        redirect.close.assert_called_once()

    def test_image_proxy_rejects_non_image_and_oversized_responses(self):
        public_result = [(2, 1, 6, '', ('8.8.8.8', 443))]
        non_image = Mock(
            status_code=200,
            headers={'Content-Type': 'text/html', 'Content-Length': '10'},
        )
        non_image.close = Mock()
        oversized = Mock(
            status_code=200,
            headers={
                'Content-Type': 'image/jpeg',
                'Content-Length': str(app_module.MAX_PROXY_IMAGE_BYTES + 1),
            },
        )
        oversized.close = Mock()

        with patch.object(app_module.socket, 'getaddrinfo', return_value=public_result):
            with patch.object(app_module._image_session, 'get', return_value=non_image):
                non_image_response = self.client.get(
                    f'/api/proxy-image?url={INSTAGRAM_IMAGE_URL}'
                )
            with patch.object(app_module._image_session, 'get', return_value=oversized):
                oversized_response = self.client.get(
                    f'/api/proxy-image?url={INSTAGRAM_IMAGE_URL}'
                )

        self.assertEqual(415, non_image_response.status_code)
        self.assertEqual(413, oversized_response.status_code)

    def test_image_proxy_returns_bounded_public_image(self):
        public_result = [(2, 1, 6, '', ('8.8.8.8', 443))]
        upstream = Mock(
            status_code=200,
            headers={'Content-Type': 'image/jpeg', 'Content-Length': '4'},
        )
        upstream.iter_content.return_value = [b'im', b'age']
        upstream.close = Mock()

        with (
            patch.object(app_module.socket, 'getaddrinfo', return_value=public_result),
            patch.object(app_module._image_session, 'get', return_value=upstream),
        ):
            response = self.client.get(
                f'/api/proxy-image?url={INSTAGRAM_IMAGE_URL}'
            )

        self.assertEqual(200, response.status_code)
        self.assertEqual(b'image', response.data)
        self.assertEqual('image/jpeg', response.content_type)
        self.assertEqual('nosniff', response.headers['X-Content-Type-Options'])

    def test_proxy_rate_limit_returns_429(self):
        with patch.object(app_module, 'PROXY_RATE_LIMIT', 2):
            first = self.client.get('/api/proxy-image?url=https://example.com/a.jpg')
            second = self.client.get('/api/proxy-image?url=https://example.com/a.jpg')
            third = self.client.get('/api/proxy-image?url=https://example.com/a.jpg')

        self.assertEqual(400, first.status_code)
        self.assertEqual(400, second.status_code)
        self.assertEqual(429, third.status_code)
        self.assertIn('Retry-After', third.headers)


if __name__ == '__main__':
    unittest.main()
