from django.db.models import Q
from rest_framework import generics, permissions

from .models import Order
from .permissions import IsBuyerOrSeller, IsSellerOnly
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusUpdateSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Order.objects
            .filter(Q(buyer=user) | Q(seller=user))
            .select_related('product__category', 'product__seller', 'buyer', 'seller')
            .prefetch_related('product__images', 'review')
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsBuyerOrSeller]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.select_related(
            'product__category', 'product__seller', 'buyer', 'seller'
        ).prefetch_related('product__images')


class OrderStatusUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/orders/<id>/status/
    Only the seller can advance the order status.
    """
    permission_classes = [permissions.IsAuthenticated, IsSellerOnly]
    serializer_class = OrderStatusUpdateSerializer
    http_method_names = ['patch']

    def get_queryset(self):
        return Order.objects.filter(seller=self.request.user)
