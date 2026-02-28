"""
Root URL configuration for Analytics Service.
"""
from django.urls import path, include

urlpatterns = [
    path("api/v1/urls/", include("analytics.urls")),
    path("health", include("analytics.health_urls")),
]
