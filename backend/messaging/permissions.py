from rest_framework.permissions import BasePermission


class IsConversationParticipant(BasePermission):
    """Allow access only to participants of the conversation."""

    def has_object_permission(self, request, view, obj):
        return request.user in obj.participants.all()
