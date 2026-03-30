import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from cloudinary_storage.storage import MediaCloudinaryStorage

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
            
        # If the file path is a direct HTTP URL, return it
        if str(name).startswith('http://') or str(name).startswith('https://'):
            return name
            
        local_path = self.local_storage.path(name)
        # Check if the file exists on the local disk
        if os.path.exists(local_path):
            return self.local_storage.url(name)
            
        # Otherwise, generate the Cloudinary URL
        return super().url(name)

    def exists(self, name):
        if self.local_storage.exists(name):
            return True
        return super().exists(name)

    def open(self, name, mode='rb'):
        if self.local_storage.exists(name):
            return self.local_storage.open(name, mode)
        return super().open(name, mode)
