import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AdminNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Only allow authenticated admins or staff
        if self.user and (self.user.is_authenticated and (self.user.role == "admin" or self.user.is_staff)):
            self.group_name = "admin_notifications"
            
            # Join group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            # Leave group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from group
    async def bug_report_message(self, event):
        data = event["data"]
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "NEW_BUG_REPORT",
            "payload": data
        }))
