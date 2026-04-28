from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        'reviewer', 'seller', 'order',
        'communication_score', 'shipping_speed_score', 'response_time_score',
        'created_at',
    )
    list_filter = ('communication_score', 'shipping_speed_score', 'response_time_score')
    search_fields = ('reviewer__username', 'seller__username')
