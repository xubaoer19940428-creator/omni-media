from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import mimetypes
import os
import re
from typing import Optional
import uuid


ALLOWED_MEDIA_EXTENSIONS = {'.m4a', '.m4v', '.mkv', '.mov', '.mp3', '.mp4', '.webm'}
OBJECT_PREFIX_RE = re.compile(r'^[a-z0-9][a-z0-9/_-]{0,127}$')
DOWNLOAD_NAME_RE = re.compile(
    r'^[a-z][a-z0-9_]{0,31}_[0-9a-f]{32}\.(?:mp4|webm|mkv|mov|m4a|m4v|mp3)$'
)


class StorageConfigurationError(RuntimeError):
    pass


class StoragePublishError(RuntimeError):
    pass


@dataclass(frozen=True)
class PublishedObject:
    download_url: str
    filename: str
    expires_in: Optional[int] = None
    remove_local_file: bool = False


class LocalStorage:
    name = 'local'

    def publish(self, local_path: Path, download_name: str) -> PublishedObject:
        return PublishedObject(
            download_url=f'/download/{local_path.name}',
            filename=download_name,
        )


class R2Storage:
    name = 'r2'

    def __init__(
        self,
        account_id: str,
        bucket_name: str,
        access_key_id: str,
        secret_access_key: str,
        object_prefix: str = 'downloads',
        presigned_url_seconds: int = 600,
        client=None,
    ):
        missing = [
            name
            for name, value in (
                ('R2_ACCOUNT_ID', account_id),
                ('R2_BUCKET_NAME', bucket_name),
                ('R2_ACCESS_KEY_ID', access_key_id),
                ('R2_SECRET_ACCESS_KEY', secret_access_key),
            )
            if not value
        ]
        if missing:
            raise StorageConfigurationError(
                f"Missing R2 configuration: {', '.join(missing)}"
            )

        normalized_prefix = object_prefix.strip('/')
        if not OBJECT_PREFIX_RE.fullmatch(normalized_prefix):
            raise StorageConfigurationError('R2_OBJECT_PREFIX is invalid')
        if not 1 <= presigned_url_seconds <= 604_800:
            raise StorageConfigurationError(
                'R2_PRESIGNED_URL_SECONDS must be between 1 and 604800'
            )

        self.bucket_name = bucket_name
        self.object_prefix = normalized_prefix
        self.presigned_url_seconds = presigned_url_seconds

        if client is None:
            import boto3
            from botocore.config import Config

            client = boto3.client(
                's3',
                endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
                region_name='auto',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                config=Config(
                    connect_timeout=10,
                    read_timeout=120,
                    retries={'max_attempts': 3, 'mode': 'standard'},
                ),
            )
        self.client = client

    def _object_key(self, local_path: Path) -> str:
        extension = local_path.suffix.lower()
        if extension not in ALLOWED_MEDIA_EXTENSIONS:
            raise StoragePublishError('The completed media extension is not allowed')
        date_path = datetime.now(timezone.utc).strftime('%Y/%m/%d')
        return f'{self.object_prefix}/{date_path}/{uuid.uuid4().hex}{extension}'

    def publish(self, local_path: Path, download_name: str) -> PublishedObject:
        if not DOWNLOAD_NAME_RE.fullmatch(download_name):
            raise StoragePublishError('The download filename is invalid')

        object_key = self._object_key(local_path)
        content_type = mimetypes.guess_type(local_path.name)[0] or 'application/octet-stream'
        try:
            self.client.upload_file(
                str(local_path),
                self.bucket_name,
                object_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'ContentDisposition': f'attachment; filename="{download_name}"',
                },
            )
        except Exception as exc:
            raise StoragePublishError('R2 upload failed') from exc

        try:
            download_url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_key},
                ExpiresIn=self.presigned_url_seconds,
            )
        except Exception as exc:
            try:
                self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            except Exception:
                pass
            raise StoragePublishError('R2 download signing failed') from exc

        return PublishedObject(
            download_url=download_url,
            filename=download_name,
            expires_in=self.presigned_url_seconds,
            remove_local_file=True,
        )


def create_storage_backend(environ=None):
    environ = os.environ if environ is None else environ
    backend_name = environ.get('STORAGE_BACKEND', 'local').strip().lower()
    if backend_name == 'local':
        return LocalStorage()
    if backend_name != 'r2':
        raise StorageConfigurationError(
            'STORAGE_BACKEND must be either local or r2'
        )

    try:
        presigned_seconds = int(environ.get('R2_PRESIGNED_URL_SECONDS', '600'))
    except ValueError as exc:
        raise StorageConfigurationError(
            'R2_PRESIGNED_URL_SECONDS must be an integer'
        ) from exc

    return R2Storage(
        account_id=environ.get('R2_ACCOUNT_ID', ''),
        bucket_name=environ.get('R2_BUCKET_NAME', ''),
        access_key_id=environ.get('R2_ACCESS_KEY_ID', ''),
        secret_access_key=environ.get('R2_SECRET_ACCESS_KEY', ''),
        object_prefix=environ.get('R2_OBJECT_PREFIX', 'downloads'),
        presigned_url_seconds=presigned_seconds,
    )
