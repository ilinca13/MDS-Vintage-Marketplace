from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'buyer', 'seller', 'price_at_purchase', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('buyer__username', 'seller__username', 'product__title')
    readonly_fields = ('price_at_purchase', 'buyer', 'seller', 'product', 'created_at')
