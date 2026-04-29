from django.urls import path

from .views import WishlistItemDeleteView, WishlistListCreateView, WishlistToggleView

urlpatterns = [
    path('wishlist/', WishlistListCreateView.as_view(), name='wishlist-list-create'),
    path('wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    path('wishlist/<int:pk>/', WishlistItemDeleteView.as_view(), name='wishlist-item-delete'),
]
