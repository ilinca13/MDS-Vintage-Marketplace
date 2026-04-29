from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsBuyerOrSeller(BasePermission):
    """Allow access only to the buyer or seller of the order."""

    def has_object_permission(self, request, view, obj):
        return request.user in (obj.buyer, obj.seller)


class IsSellerOnly(BasePermission):
    """Allow status updates only to the seller of the order."""

    def has_object_permission(self, request, view, obj):
        return request.user == obj.seller
