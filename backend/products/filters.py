import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    seller = django_filters.CharFilter(field_name='seller__username', lookup_expr='exact')

    class Meta:
        model = Product
        fields = ['category', 'condition', 'brand', 'location', 'status', 'min_price', 'max_price', 'seller']
