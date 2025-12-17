from rest_framework import serializers
from .models import ChatChannel, ChatMessage, ChatChannelMember

class ChatChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatChannel
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'

class ChatChannelMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatChannelMember
        fields = '__all__'
