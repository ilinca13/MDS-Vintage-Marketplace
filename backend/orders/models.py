from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash la livrare'
        CARD = 'card', 'Card (simulat)'

    class ShippingMethod(models.TextChoices):
        POSTA_ROMANA  = 'posta_romana',  'Poșta Română (15 RON)'
        FAN_COURIER   = 'fan_courier',   'Fan Courier (20 RON)'
        CARGUS        = 'cargus',        'Cargus (18 RON)'
        DPD           = 'dpd',           'DPD (17 RON)'
        RIDICARE      = 'ridicare',      'Ridicare personală (gratuit)'

    SHIPPING_COSTS = {
        'posta_romana': 15,
        'fan_courier':  20,
        'cargus':       18,
        'dpd':          17,
        'ridicare':      0,
    }

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sales',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    shipping_method = models.CharField(max_length=20, choices=ShippingMethod.choices, default=ShippingMethod.POSTA_ROMANA)
    shipping_cost = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    shipping_address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} — {self.product.title} ({self.buyer.username} → {self.seller.username})'
