from django.urls import path

from .views import CategoryListView, ProductDetailView, ProductImageDeleteView, ProductImageUploadView, ProductListCreateView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/images/', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('products/<int:pk>/images/<int:img_pk>/', ProductImageDeleteView.as_view(), name='product-image-delete'),
]
