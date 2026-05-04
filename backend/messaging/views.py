from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import Conversation, Message
from .permissions import IsConversationParticipant
from .serializers import (
    ConversationDetailSerializer,
    ConversationSerializer,
    ConversationStartSerializer,
    MessageCreateSerializer,
)


class ConversationListView(generics.ListAPIView):
    """
    GET /api/conversations/  — list all conversations for current user
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(participants=self.request.user)
            .prefetch_related('participants', 'messages__sender', 'product__images')
            .select_related('product')
            .order_by('-messages__created_at')
            .distinct()
        )


class ConversationStartView(APIView):
    """
    POST /api/conversations/start/  { "product_id": <id> }
    Start a conversation about a product, or return the existing one.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConversationStartSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        product = Product.objects.get(pk=serializer.validated_data['product_id'])
        seller = product.seller
        buyer = request.user

        existing = Conversation.objects.filter(
            product=product,
            participants=buyer,
        ).filter(participants=seller).first()

        if existing:
            return Response(
                ConversationDetailSerializer(existing, context={'request': request}).data,
                status=status.HTTP_200_OK,
            )

        conversation = Conversation.objects.create(product=product)
        conversation.participants.add(buyer, seller)

        return Response(
            ConversationDetailSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(generics.RetrieveAPIView):
    """
    GET /api/conversations/<id>/  — retrieve conversation + all messages
    Automatically marks incoming messages as read.
    """
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]

    def get_queryset(self):
        return Conversation.objects.prefetch_related('participants', 'messages').select_related('product')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class MessageCreateView(generics.CreateAPIView):
    """
    POST /api/conversations/<pk>/messages/  — send a message
    """
    serializer_class = MessageCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self):
        conversation = generics.get_object_or_404(
            Conversation, pk=self.kwargs['pk'], participants=self.request.user
        )
        return conversation

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['conversation'] = self.get_conversation()
        return ctx
