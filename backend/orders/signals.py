from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import Order


@receiver(post_save, sender=Order)
def handle_order_status_change(sender, instance, **kwargs):
    product = instance.product

    if instance.status == Order.Status.DELIVERED:
        product.status = Product.Status.SOLD
        product.save(update_fields=['status'])

    elif instance.status == Order.Status.CANCELLED:
        has_active_order = Order.objects.filter(
            product=product,
            status__in=[Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.SHIPPED],
        ).exclude(pk=instance.pk).exists()

        if not has_active_order:
            product.status = Product.Status.ACTIVE
            product.save(update_fields=['status'])
