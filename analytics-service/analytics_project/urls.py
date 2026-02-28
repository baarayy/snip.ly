"""
Root URL configuration for Analytics Service.
"""
from django.urls import path, include
from analytics.views import TrendingView

urlpatterns = [
    path("api/v1/urls/", include("analytics.urls")),
    path("api/v1/trending", TrendingView.as_view(), name="trending"),
    path("health", include("analytics.health_urls")),
]
