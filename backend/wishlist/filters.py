import django_filters

from .models import WishlistItem


class WishlistItemFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='product__price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='product__price', lookup_expr='lte')
    category = django_filters.NumberFilter(field_name='product__category')
    condition = django_filters.CharFilter(field_name='product__condition')
    brand = django_filters.CharFilter(field_name='product__brand', lookup_expr='icontains')

    class Meta:
        model = WishlistItem
        fields = ['category', 'condition', 'brand', 'min_price', 'max_price']
