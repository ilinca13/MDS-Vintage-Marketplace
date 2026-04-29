from django.urls import path

from .views import ReviewDetailView, ReviewListCreateView, SellerReviewSummaryView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('users/<int:pk>/review-summary/', SellerReviewSummaryView.as_view(), name='seller-review-summary'),
]
