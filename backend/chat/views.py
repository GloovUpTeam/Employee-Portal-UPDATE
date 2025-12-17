from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatChannel, ChatMessage
from .serializers import ChatChannelSerializer, ChatMessageSerializer
from django.db.models import Q

class ChannelViewSet(viewsets.ModelViewSet):
    queryset = ChatChannel.objects.all()
    serializer_class = ChatChannelSerializer

    def get_queryset(self):
        # TODO: Filter based on user portal/role (ACL)
        # user = self.request.user
        # return ChatChannel.objects.filter(...)
        return super().get_queryset()

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        channel = self.get_object()
        # Pagination is handled by DRF's default limit/offset if configured globally
        # or we manually slice.
        limit = int(request.query_params.get('limit', 50))
        
        # Simple optimization: fetch latest N messages
        messages = channel.messages.order_by('-created_at')[:limit]
        # Reverse them to show oldest first in UI if needed, or keep desc
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        # Fallback REST endpoint for sending
        channel = self.get_object()
        data = request.data.copy()
        data['channel'] = channel.id
        # data['sender_id'] = request.user.id # TODO: Integration
        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
