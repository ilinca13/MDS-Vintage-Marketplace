from django.urls import path

from .views import ConversationDetailView, ConversationListView, ConversationStartView, MessageCreateView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', ConversationStartView.as_view(), name='conversation-start'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/messages/', MessageCreateView.as_view(), name='message-create'),
]
