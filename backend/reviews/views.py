from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer

User = get_user_model()


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reviews/?seller=<id>  — public list of reviews for a seller
    POST /api/reviews/              — create a review (authenticated buyer only)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.select_related(
            'reviewer', 'seller', 'order__product'
        ).prefetch_related('order__product__images')
        seller_id = self.request.query_params.get('seller')
        if seller_id:
            qs = qs.filter(seller__id=seller_id)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer


class ReviewDetailView(generics.RetrieveAPIView):
    """
    GET /api/reviews/<id>/  — public detail of a single review
    """
    queryset = Review.objects.select_related(
        'reviewer', 'seller', 'order__product'
    ).prefetch_related('order__product__images')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]


class SellerReviewSummaryView(generics.RetrieveAPIView):
    """
    GET /api/users/<id>/review-summary/
    Returns aggregated scores for a seller.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        from django.db.models import Avg, Count
        from rest_framework.response import Response

        seller = generics.get_object_or_404(User, pk=pk)
        stats = Review.objects.filter(seller=seller).aggregate(
            total=Count('id'),
            avg_communication=Avg('communication_score'),
            avg_shipping=Avg('shipping_speed_score'),
            avg_response_time=Avg('response_time_score'),
        )

        def fmt(val):
            return round(val, 2) if val is not None else None

        overall = None
        if stats['avg_communication'] is not None:
            overall = round(
                (stats['avg_communication'] + stats['avg_shipping'] + stats['avg_response_time']) / 3,
                2,
            )

        return Response({
            'seller_id': seller.id,
            'seller_username': seller.username,
            'total_reviews': stats['total'],
            'avg_communication': fmt(stats['avg_communication']),
            'avg_shipping_speed': fmt(stats['avg_shipping']),
            'avg_response_time': fmt(stats['avg_response_time']),
            'overall_score': overall,
        })
