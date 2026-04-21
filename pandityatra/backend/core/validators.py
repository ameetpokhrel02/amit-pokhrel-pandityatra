import os
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_file_size(value):
    """
    Validates that a file is not larger than a certain size.
    Default: 5MB
    """
    filesize = value.size
    
    if filesize > 5 * 1024 * 1024:
        raise ValidationError(_("The maximum file size that can be uploaded is 5MB"))
    else:
        return value

def validate_image_extension(value):
    """
    Validates that the file has a safe image extension.
    """
    ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    if not ext.lower() in valid_extensions:
        raise ValidationError(_('Unsupported file extension. Allowed: .jpg, .jpeg, .png, .webp'))

def validate_document_extension(value):
    """
    Validates that the file has a safe document extension.
    """
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    if not ext.lower() in valid_extensions:
        raise ValidationError(_('Unsupported file extension. Allowed: .pdf, .doc, .docx, .jpg, .png'))
