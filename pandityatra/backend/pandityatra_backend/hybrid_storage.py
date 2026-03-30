import os
import logging
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from cloudinary_storage.storage import MediaCloudinaryStorage
from whitenoise.storage import CompressedManifestStaticFilesStorage

logger = logging.getLogger(__name__)

class HybridMediaStorage(MediaCloudinaryStorage):
    """
    Custom storage backend that serves existing files from local storage 
    while uploading new files to Cloudinary.
    This prevents breaking existing image URLs.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.local_storage = FileSystemStorage(
            location=settings.MEDIA_ROOT,
            base_url=settings.MEDIA_URL
        )

    def url(self, name):
        if not name:
            return super().url(name)
        if str(name).startswith(('http://', 'https://')):
            return name
        try:
            local_path = self.local_storage.path(name)
            if os.path.exists(local_path):
                return self.local_storage.url(name)
        except Exception:
            pass
        return super().url(name)

    def exists(self, name):
        if self.local_storage.exists(name):
            return True
        return super().exists(name)

    def open(self, name, mode='rb'):
        if self.local_storage.exists(name):
            return self.local_storage.open(name, mode)
        return super().open(name, mode)


class SafeWhiteNoiseStorage(CompressedManifestStaticFilesStorage):
    """
    Catches broken CSS references and missing files during collectstatic
    so WhiteNoise's manifest builder/compressor doesn't crash Docker.
    """
    manifest_strict = False

    def hashed_name(self, name, content=None, filename=None):
        try:
            return super().hashed_name(name, content, filename)
        except (ValueError, Exception) as e:
            # Fallback to the original name if hashing fails (e.g. file missing)
            logger.warning(f"WhiteNoise skipped missing CSS reference: {name} - {str(e)}")
            return name

    def post_process(self, *args, **kwargs):
        """
        Wrap post_process to catch FileNotFoundError or ValueError during 
        manifest generation and compression.
        """
        try:
            # We must yield from the generator and catch errors inside or around it
            gen = super().post_process(*args, **kwargs)
            while True:
                try:
                    yield next(gen)
                except StopIteration:
                    break
                except (ValueError, FileNotFoundError, Exception) as e:
                    logger.warning(f"WhiteNoise post-process error: {str(e)}")
                    continue
        except (ValueError, FileNotFoundError, Exception) as e:
            logger.error(f"WhiteNoise static post_process failed critically: {str(e)}")