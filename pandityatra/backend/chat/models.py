from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """
    Chat room between customer and pandit for a specific booking
    """
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='chat_room'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_chats'
    )
    pandit = models.ForeignKey(
        'pandits.Pandit',
        on_delete=models.CASCADE,
        related_name='pandit_chats'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'pandit']),
            models.Index(fields=['booking']),
        ]
    
    def __str__(self):
        return f"Chat: {self.customer.username} <-> {self.pandit.user.username}"


class Message(models.Model):
    """
    Individual message in a chat room
    """
    MESSAGE_TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('FILE', 'File'),
        ('SYSTEM', 'System Message'),
    ]
    
    chat_room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPE_CHOICES,
        default='TEXT'
    )
    content = models.TextField()
    content_ne = models.TextField(blank=True, null=True, verbose_name='Content (Nepali)')  # Nepali translation
    file_url = models.URLField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['chat_room', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
