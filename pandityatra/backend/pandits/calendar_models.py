# Backend Calendar Models for PanditYatra
# This file contains the database models for pandit availability and calendar management

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import datetime, time

class PanditAvailability(models.Model):
    """
    Model to store pandit availability/unavailability slots
    """
    AVAILABILITY_TYPES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
        ('blocked', 'Blocked'),
    ]
    
    pandit = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    availability_type = models.CharField(max_length=20, choices=AVAILABILITY_TYPES, default='available')
    reason = models.CharField(max_length=200, blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurring_days = models.JSONField(blank=True, null=True)  # [0,1,2,3,4,5,6] for days of week
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pandit_availability'
        ordering = ['date', 'start_time']
        unique_together = ['pandit', 'date', 'start_time', 'end_time']
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.pandit.username} - {self.date} ({self.start_time}-{self.end_time}) - {self.availability_type}"


class PanditWorkingHours(models.Model):
    """
    Model to store pandit's general working hours
    """
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    pandit = models.ForeignKey(User, on_delete=models.CASCADE, related_name='working_hours')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField(default=time(9, 0))  # 9:00 AM
    end_time = models.TimeField(default=time(18, 0))   # 6:00 PM
    is_working = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pandit_working_hours'
        unique_together = ['pandit', 'day_of_week']
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        day_name = dict(self.DAYS_OF_WEEK)[self.day_of_week]
        return f"{self.pandit.username} - {day_name} ({self.start_time}-{self.end_time})"