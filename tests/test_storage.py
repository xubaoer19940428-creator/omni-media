import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from storage import (
    LocalStorage,
    R2Storage,
    StorageConfigurationError,
    StoragePublishError,
    create_storage_backend,
)


class StorageTests(unittest.TestCase):
    filename = f'youtube_{"a" * 32}.mp4'

    def _r2(self, client):
        return R2Storage(
            account_id='account-id',
            bucket_name='omnimedia-downloads',
            access_key_id='access-key',
            secret_access_key='secret-key',
            client=client,
        )

    def test_local_storage_preserves_relative_download_contract(self):
        published = LocalStorage().publish(Path('/tmp/youtube_test.mp4'), self.filename)
        self.assertEqual('/download/youtube_test.mp4', published.download_url)
        self.assertFalse(published.remove_local_file)

    def test_r2_uploads_controlled_key_metadata_and_signs_get(self):
        client = Mock()
        client.generate_presigned_url.return_value = 'https://signed.example/video'

        with tempfile.TemporaryDirectory() as temp_dir:
            media = Path(temp_dir) / self.filename
            media.write_bytes(b'video')
            published = self._r2(client).publish(media, self.filename)

        upload_args = client.upload_file.call_args
        object_key = upload_args.args[2]
        self.assertRegex(
            object_key,
            r'^downloads/\d{4}/\d{2}/\d{2}/[0-9a-f]{32}\.mp4$',
        )
        self.assertEqual('video/mp4', upload_args.kwargs['ExtraArgs']['ContentType'])
        self.assertEqual(
            f'attachment; filename="{self.filename}"',
            upload_args.kwargs['ExtraArgs']['ContentDisposition'],
        )
        client.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={'Bucket': 'omnimedia-downloads', 'Key': object_key},
            ExpiresIn=600,
        )
        self.assertEqual('https://signed.example/video', published.download_url)
        self.assertEqual(600, published.expires_in)
        self.assertTrue(published.remove_local_file)

    def test_local_and_r2_storage_accept_mp3_downloads(self):
        filename = f'youtube_{"b" * 32}.mp3'
        client = Mock()
        client.generate_presigned_url.return_value = 'https://signed.example/audio'

        with tempfile.TemporaryDirectory() as temp_dir:
            media = Path(temp_dir) / filename
            media.write_bytes(b'audio')
            local = LocalStorage().publish(media, filename)
            published = self._r2(client).publish(media, filename)

        self.assertEqual(f'/download/{filename}', local.download_url)
        upload_args = client.upload_file.call_args
        self.assertRegex(
            upload_args.args[2],
            r'^downloads/\d{4}/\d{2}/\d{2}/[0-9a-f]{32}\.mp3$',
        )
        self.assertEqual('audio/mpeg', upload_args.kwargs['ExtraArgs']['ContentType'])
        self.assertEqual('https://signed.example/audio', published.download_url)

    def test_r2_upload_failure_does_not_sign(self):
        client = Mock()
        client.upload_file.side_effect = RuntimeError('upload failed')
        with self.assertRaises(StoragePublishError):
            self._r2(client).publish(Path('/tmp/video.mp4'), self.filename)
        client.generate_presigned_url.assert_not_called()

    def test_r2_signing_failure_deletes_uploaded_object(self):
        client = Mock()
        client.generate_presigned_url.side_effect = RuntimeError('sign failed')
        with self.assertRaises(StoragePublishError):
            self._r2(client).publish(Path('/tmp/video.mp4'), self.filename)
        delete_args = client.delete_object.call_args.kwargs
        self.assertEqual('omnimedia-downloads', delete_args['Bucket'])
        self.assertRegex(delete_args['Key'], r'^downloads/.+\.mp4$')

    def test_r2_rejects_uncontrolled_extension_and_filename(self):
        client = Mock()
        storage = self._r2(client)
        with self.assertRaises(StoragePublishError):
            storage.publish(Path('/tmp/video.exe'), self.filename)
        with self.assertRaises(StoragePublishError):
            storage.publish(Path('/tmp/video.mp4'), '../video.mp4')
        client.upload_file.assert_not_called()

    def test_r2_configuration_is_required_and_expiry_is_bounded(self):
        with self.assertRaises(StorageConfigurationError):
            create_storage_backend({'STORAGE_BACKEND': 'r2'})
        with self.assertRaises(StorageConfigurationError):
            R2Storage('a', 'b', 'c', 'd', presigned_url_seconds=604_801, client=Mock())


if __name__ == '__main__':
    unittest.main()
