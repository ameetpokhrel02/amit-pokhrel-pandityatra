# Generated migration for ChatMessage model (Dual-mode chatbot)

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
        ('bookings', '0001_initial'),
        ('pandits', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mode', models.CharField(
                    choices=[('guide', 'AI Guide Mode'), ('interaction', 'Pandit Interaction Mode')],
                    default='guide',
                    help_text='guide=AI help, interaction=pandit chat',
                    max_length=20
                )),
                ('sender', models.CharField(
                    choices=[('user', 'User'), ('ai', 'AI'), ('pandit', 'Pandit')],
                    default='user',
                    max_length=20
                )),
                ('content', models.TextField()),
                ('content_ne', models.TextField(blank=True, null=True, verbose_name='Content (Nepali)')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('is_read', models.BooleanField(default=False)),
                ('booking', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_messages', to='bookings.booking')),
                ('pandit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sent_chat_messages', to='pandits.pandit')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='guide_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['mode', 'user', 'timestamp'], name='chat_chatme_mode_idx'),
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['booking', 'timestamp'], name='chat_chatme_booking_idx'),
        ),
    ]
