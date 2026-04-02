from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class BugReport(models.Model):
    CATEGORY_CHOICES = [
        ("UI", "User Interface"),
        ("FUNCTIONAL", "Functional Bug"),
        ("PERFORMANCE", "Performance"),
        ("SECURITY", "Security"),
        ("TEXT_ISSUE", "Text/Content Issue"),
        ("INTEGRATION", "Integration"),
        ("OTHER", "Other"),
    ]

    SEVERITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    STATUS_CHOICES = [
        ("NEW", "New"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="OTHER")
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="MEDIUM")
    
    # Using CloudinaryField with resource_type="auto" to support images and PDFs
    attachment = CloudinaryField(
        "attachment", 
        null=True, 
        blank=True,
        resource_type="auto",
        folder="bug_reports/"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name="bug_reports"
    )
    admin_comment = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"
