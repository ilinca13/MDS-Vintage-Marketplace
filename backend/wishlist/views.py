from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .filters import WishlistItemFilter
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = WishlistItemFilter
    search_fields = ['product__title', 'product__brand', 'product__description']
    ordering_fields = ['product__price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            WishlistItem.objects
            .filter(user=self.request.user)
            .select_related('product__category', 'product__seller')
            .prefetch_related('product__images')
        )


class WishlistItemDeleteView(generics.DestroyAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {'detail': 'Product removed from wishlist.'},
            status=status.HTTP_200_OK,
        )


class WishlistToggleView(APIView):
    """
    POST /api/wishlist/toggle/  { "product": <id> }
    - If the product is not in the wishlist → adds it   (added: true)
    - If the product is already there      → removes it (added: false)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product')
        if not product_id:
            return Response({'detail': 'product field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        product = generics.get_object_or_404(Product, pk=product_id)
        item = WishlistItem.objects.filter(user=request.user, product=product).first()

        if item:
            item.delete()
            return Response({'added': False, 'detail': 'Removed from wishlist.'}, status=status.HTTP_200_OK)

        WishlistItem.objects.create(user=request.user, product=product)
        return Response({'added': True, 'detail': 'Added to wishlist.'}, status=status.HTTP_201_CREATED)
