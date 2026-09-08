import unittest
from unittest.mock import patch

import app as app_module
from gallery_integrations import (
    GalleryError,
    classify_media_url,
    resolve_gallery,
    validate_public_url,
)


class GalleryIntegrationTests(unittest.TestCase):
    def setUp(self):
        app_module._rate_limit_state.clear()
        app_module.app.config.update(TESTING=True)
        self.client = app_module.app.test_client()

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('93.184.216.34', 443))])
    @patch('gallery_integrations.importlib.util.find_spec', return_value=object())
    @patch('gallery_integrations.subprocess.run')
    def test_resolve_gallery_bounds_and_deduplicates_urls(self, run, _find_spec, _dns):
        run.return_value = type('Completed', (), {
            'returncode': 0,
            'stdout': 'https://cdn.example.com/a.jpg\nhttps://cdn.example.com/a.jpg\nhttps://cdn.example.com/b.jpg\n',
        })()
        result = resolve_gallery('https://imgur.com/post', max_items=2)
        self.assertEqual(['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'], result)
        self.assertEqual(1, run.call_count)
        command = run.call_args.args[0]
        self.assertIn('--config-ignore', command)
        self.assertIn('--no-postprocessors', command)
        self.assertIn('--http-timeout', command)

    def test_resolve_gallery_rejects_invalid_port(self):
        with self.assertRaises(GalleryError):
            resolve_gallery('https://example.com:abc')

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('93.184.216.34', 443))])
    def test_gallery_allowlist_accepts_subdomains_and_rejects_suffix_confusion(self, _dns):
        self.assertEqual(
            'https://i.imgur.com/example.jpg',
            validate_public_url('https://i.imgur.com/example.jpg', require_allowed_host=True),
        )
        with self.assertRaises(GalleryError):
            validate_public_url('https://imgur.com.evil.example/post', require_allowed_host=True)

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('100.64.0.1', 443))])
    def test_resolve_gallery_rejects_non_global_address(self, _dns):
        with self.assertRaises(GalleryError):
            resolve_gallery('https://imgur.com/post')

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('93.184.216.34', 443))])
    @patch('gallery_integrations.importlib.util.find_spec', return_value=None)
    def test_endpoint_returns_503_when_gallery_dl_is_missing(self, _find_spec, _dns):
        response = self.client.post('/api/gallery/resolve', json={'url': 'https://imgur.com/post'})
        self.assertEqual(503, response.status_code)

    def test_gallery_endpoint_returns_typed_media_items(self):
        urls = [
            'https://i.imgur.com/photo.jpg?size=large',
            'https://i.imgur.com/clip.mp4',
            'https://i.imgur.com/sound.mp3',
            'https://i.imgur.com/unknown',
        ]
        with patch.object(app_module, 'resolve_gallery', return_value=urls):
            response = self.client.post('/api/gallery/resolve', json={
                'url': 'https://imgur.com/gallery/example',
            })

        self.assertEqual(200, response.status_code)
        data = response.get_json()
        self.assertEqual([urls[0]], data['images'])
        self.assertEqual(
            ['image', 'video', 'audio', 'media'],
            [item['media_type'] for item in data['items']],
        )

    def test_classify_media_url_ignores_query_string(self):
        self.assertEqual('image', classify_media_url('https://example.com/a.webp?x=.mp4'))
        self.assertEqual('video', classify_media_url('https://example.com/a.webm?x=.jpg'))


if __name__ == '__main__':
    unittest.main()
