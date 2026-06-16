from django.urls import path

from .views import GenerateDescriptionView, RecommendationsView

urlpatterns = [
    path("ai/generate-description/", GenerateDescriptionView.as_view(), name="ai-generate-description"),
    path("ai/recommendations/<int:product_id>/", RecommendationsView.as_view(), name="ai-recommendations"),
]
