from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'is_primary', 'order')


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used in list views."""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'title', 'price', 'condition', 'status',
            'size', 'brand', 'location',
            'seller_username', 'category_name',
            'primary_image', 'created_at',
        )

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if image:
            request = self.context.get('request')
            return request.build_absolute_uri(image.image.url) if request else image.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer used in retrieve views."""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'title', 'description', 'price',
            'condition', 'status', 'size', 'brand', 'location',
            'views_count', 'created_at', 'updated_at',
            'seller_id', 'seller_username',
            'category', 'images',
        )


class ProductWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products."""

    class Meta:
        model = Product
        fields = (
            'title', 'description', 'price',
            'category', 'condition', 'size', 'brand', 'location',
        )

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class ProductImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'is_primary', 'order')

    def create(self, validated_data):
        product = self.context['product']
        if validated_data.get('is_primary'):
            product.images.filter(is_primary=True).update(is_primary=False)
        return ProductImage.objects.create(product=product, **validated_data)
