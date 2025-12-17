import uuid
from django.db import models
from django.utils import timezone

class ChatChannel(models.Model):
    CHANNEL_TYPES = (
        ('public', 'Public'),
        ('private', 'Private'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=CHANNEL_TYPES, default='public')
    
    # Store lists as JSON
    portals = models.JSONField(default=list) # e.g. ["admin", "employee"]
    allowed_roles = models.JSONField(default=list) # e.g. ["admin", "manager"]
    
    created_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_channels'
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name

class ChatChannelMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='members')
    user_id = models.UUIDField()
    role_in_channel = models.CharField(max_length=50, default='member') # 'owner', 'admin', 'member'
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_channel_members'
        unique_together = ('channel', 'user_id')

class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender_id = models.UUIDField()
    text = models.TextField(blank=True)
    attachments = models.JSONField(default=list)
    origin_portal = models.CharField(max_length=50) # 'admin', 'employee', 'client'
    
    created_at = models.DateTimeField(default=timezone.now) # allow override for migrations
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_messages'
        indexes = [
            models.Index(fields=['channel', 'created_at']),
            models.Index(fields=['sender_id']),
        ]
