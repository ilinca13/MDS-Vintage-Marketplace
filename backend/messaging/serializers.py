from django.contrib.auth import get_user_model
from rest_framework import serializers

from products.models import Product
from .models import Conversation, Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender_username', 'content', 'is_read', 'created_at')
        read_only_fields = ('id', 'sender_username', 'is_read', 'created_at')


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('content',)

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        validated_data['conversation'] = self.context['conversation']
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the conversation list."""
    other_participant = serializers.SerializerMethodField()
    product_title = serializers.CharField(source='product.title', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'other_participant', 'product', 'product_title',
                  'last_message', 'unread_count', 'created_at')

    def get_other_participant(self, obj):
        request = self.context['request']
        other = obj.participants.exclude(id=request.user.id).first()
        return {'id': other.id, 'username': other.username} if other else None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'created_at': msg.created_at}
        return None

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False).exclude(
            sender=self.context['request'].user
        ).count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all messages for the detail view."""
    other_participant = serializers.SerializerMethodField()
    product_title = serializers.CharField(source='product.title', read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'other_participant', 'product', 'product_title', 'messages', 'created_at')

    def get_other_participant(self, obj):
        request = self.context['request']
        other = obj.participants.exclude(id=request.user.id).first()
        return {'id': other.id, 'username': other.username} if other else None


class ConversationStartSerializer(serializers.Serializer):
    """Used to start a new conversation about a product."""
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        request = self.context['request']
        product = Product.objects.filter(pk=value).first()
        if not product:
            raise serializers.ValidationError('Product not found.')
        if product.seller == request.user:
            raise serializers.ValidationError('You cannot message yourself about your own product.')
        return value
