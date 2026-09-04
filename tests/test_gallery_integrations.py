import unittest
from unittest.mock import patch

import app as app_module
from gallery_integrations import GalleryError, resolve_gallery


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
        result = resolve_gallery('https://example.com/post', max_items=2)
        self.assertEqual(['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'], result)
        self.assertEqual(1, run.call_count)
        command = run.call_args.args[0]
        self.assertIn('--config-ignore', command)
        self.assertIn('--no-postprocessors', command)
        self.assertIn('--http-timeout', command)

    def test_resolve_gallery_rejects_invalid_port(self):
        with self.assertRaises(GalleryError):
            resolve_gallery('https://example.com:abc')

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('100.64.0.1', 443))])
    def test_resolve_gallery_rejects_non_global_address(self, _dns):
        with self.assertRaises(GalleryError):
            resolve_gallery('https://example.com/post')

    @patch('gallery_integrations.socket.getaddrinfo', return_value=[(None, None, None, None, ('93.184.216.34', 443))])
    @patch('gallery_integrations.importlib.util.find_spec', return_value=None)
    def test_endpoint_returns_503_when_gallery_dl_is_missing(self, _find_spec, _dns):
        response = self.client.post('/api/gallery/resolve', json={'url': 'https://example.com/post'})
        self.assertEqual(503, response.status_code)


if __name__ == '__main__':
    unittest.main()
