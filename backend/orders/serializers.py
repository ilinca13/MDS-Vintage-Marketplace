from rest_framework import serializers

from products.models import Product
from products.serializers import ProductListSerializer
from users.serializers import UserProfileSerializer
from .models import Order


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('product', 'payment_method', 'shipping_method', 'shipping_address')

    def validate_product(self, product):
        if product.status != Product.Status.ACTIVE:
            raise serializers.ValidationError('This product is not available for purchase.')

        request = self.context['request']
        if product.seller == request.user:
            raise serializers.ValidationError('You cannot buy your own product.')

        active_order_exists = Order.objects.filter(
            product=product,
            status__in=[Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.SHIPPED],
        ).exists()
        if active_order_exists:
            raise serializers.ValidationError('This product already has an active order.')

        return product

    def validate(self, attrs):
        shipping_method = attrs.get('shipping_method', Order.ShippingMethod.POSTA_ROMANA)
        if shipping_method != Order.ShippingMethod.RIDICARE and not attrs.get('shipping_address', '').strip():
            raise serializers.ValidationError({'shipping_address': 'Adresa de livrare este obligatorie.'})
        return attrs

    def create(self, validated_data):
        product = validated_data['product']
        shipping_method = validated_data.get('shipping_method', Order.ShippingMethod.POSTA_ROMANA)
        validated_data['buyer'] = self.context['request'].user
        validated_data['seller'] = product.seller
        validated_data['price_at_purchase'] = product.price
        validated_data['shipping_cost'] = Order.SHIPPING_COSTS.get(shipping_method, 0)
        order = super().create(validated_data)
        product.status = Product.Status.RESERVED
        product.save(update_fields=['status'])
        return order


class OrderSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'payment_method', 'shipping_method', 'shipping_cost',
            'shipping_address', 'price_at_purchase',
            'created_at', 'updated_at',
            'buyer_username', 'seller_username',
            'product', 'product_detail',
        )
        read_only_fields = (
            'id', 'status', 'shipping_cost', 'price_at_purchase',
            'created_at', 'updated_at',
            'buyer_username', 'seller_username', 'product_detail',
        )


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('status',)

    def validate_status(self, new_status):
        current = self.instance.status
        allowed_transitions = {
            Order.Status.PENDING:   [Order.Status.CONFIRMED, Order.Status.CANCELLED],
            Order.Status.CONFIRMED: [Order.Status.SHIPPED,   Order.Status.CANCELLED],
            Order.Status.SHIPPED:   [Order.Status.DELIVERED, Order.Status.CANCELLED],
            Order.Status.DELIVERED: [],
            Order.Status.CANCELLED: [],
        }
        if new_status not in allowed_transitions.get(current, []):
            raise serializers.ValidationError(
                f'Cannot transition from "{current}" to "{new_status}".'
            )
        return new_status
