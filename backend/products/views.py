from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Product
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageUploadSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ProductListCreateView(generics.ListCreateAPIView):
    filterset_class = ProductFilter
    search_fields = ['title', 'description', 'brand']
    ordering_fields = ['price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Product.objects.select_related('seller', 'category').prefetch_related('images')
        if self.request.method == 'GET':
            return qs.exclude(status=Product.Status.DELETED)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductWriteSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('seller', 'category').prefetch_related('images')
    permission_classes = [IsOwnerOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Product.objects.filter(pk=instance.pk).update(views_count=instance.views_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = Product.Status.DELETED
        instance.save(update_fields=['status'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageUploadView(generics.CreateAPIView):
    serializer_class = ProductImageUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_product(self):
        product = generics.get_object_or_404(
            Product, pk=self.kwargs['pk'], seller=self.request.user
        )
        return product

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['product'] = self.get_product()
        return ctx
