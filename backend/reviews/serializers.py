from rest_framework import serializers

from orders.models import Order
from .models import Review


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            'order',
            'communication_score',
            'shipping_speed_score',
            'response_time_score',
            'comment',
        )

    def validate_order(self, order):
        request = self.context['request']

        if order.buyer != request.user:
            raise serializers.ValidationError('You can only review orders you purchased.')

        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError('You can only review a delivered order.')

        if hasattr(order, 'review'):
            raise serializers.ValidationError('You have already reviewed this order.')

        return order

    def create(self, validated_data):
        order = validated_data['order']
        validated_data['reviewer'] = self.context['request'].user
        validated_data['seller'] = order.seller
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    average_score = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source='order.product.id', read_only=True)
    product_title = serializers.CharField(source='order.product.title', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            'id',
            'reviewer_username',
            'seller_username',
            'order',
            'product_id',
            'product_title',
            'product_image',
            'communication_score',
            'shipping_speed_score',
            'response_time_score',
            'average_score',
            'comment',
            'created_at',
        )

    def get_average_score(self, obj):
        total = obj.communication_score + obj.shipping_speed_score + obj.response_time_score
        return round(total / 3, 2)

    def get_product_image(self, obj):
        image = obj.order.product.images.filter(is_primary=True).first() or obj.order.product.images.first()
        if not image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(image.image.url) if request else image.image.url
