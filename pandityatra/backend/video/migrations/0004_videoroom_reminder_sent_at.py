from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("video", "0003_videoroom_recording_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="videoroom",
            name="reminder_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
