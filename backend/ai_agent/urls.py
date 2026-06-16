from django.urls import path

from .views import GenerateDescriptionView

urlpatterns = [
    path("ai/generate-description/", GenerateDescriptionView.as_view(), name="ai-generate-description"),
]
