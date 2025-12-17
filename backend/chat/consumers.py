from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatChannel, ChatMessage
from .serializers import ChatMessageSerializer
import json

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # TODO: Validate JWT Token from self.scope['query_string']
        # self.user = ...
        await self.accept()

    async def disconnect(self, close_code):
        # Leave all groups
        # In a real app we'd track joined channels in a list
        pass

    async def receive_json(self, content):
        """
        Entry point for client messages.
        Expected format: {"action": "some_action", "data": {...}}
        """
        action = content.get("action")
        
        if action == "subscribe":
            await self.handle_subscribe(content)
        elif action == "message:send":
            await self.handle_message_send(content)
        elif action == "typing:start":
            await self.handle_typing(content, is_typing=True)
        elif action == "typing:stop":
            await self.handle_typing(content, is_typing=False)
            
    async def handle_subscribe(self, content):
        channel_id = content.get("channel_id")
        if channel_id:
            group_name = f"chat_{channel_id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            # Confirm subscription?
            
    async def handle_message_send(self, content):
        channel_id = content.get("channel_id")
        text = content.get("text")
        # sender = self.user
        
        if channel_id and text:
            # 1. Save to DB
            msg = await self.save_message(channel_id, text)
            
            # 2. Serialize
            # For now, simple dict, ideally use Serializer
            event = {
                "type": "chat_message",
                "id": str(msg.id),
                "channel_id": channel_id,
                "text": msg.text,
                "sender_id": str(msg.sender_id),
                "origin_portal": msg.origin_portal,
                "created_at": str(msg.created_at)
            }
            
            # 3. Broadcast to Group
            group_name = f"chat_{channel_id}"
            await self.channel_layer.group_send(group_name, event)

    async def handle_typing(self, content, is_typing=False):
        channel_id = content.get("channel_id")
        if channel_id:
             await self.channel_layer.group_send(
                f"chat_{channel_id}",
                {
                    "type": "user_typing",
                    "channel_id": channel_id,
                    "is_typing": is_typing,
                    # "user_id": self.user.id
                }
            )

    # Handlers for Group Messages
    async def chat_message(self, event):
        # Forward to WebSocket
        await self.send_json({
            "event": "message:new",
            "data": event
        })

    async def user_typing(self, event):
        await self.send_json({
            "event": "typing:update",
            "data": event
        })

    @database_sync_to_async
    def save_message(self, channel_id, text):
        # Stub: Replace sender_id with real user
        import uuid
        fake_sender = uuid.uuid4() 
        return ChatMessage.objects.create(
            channel_id=channel_id,
            text=text,
            sender_id=fake_sender,
            origin_portal='unknown'
        )
