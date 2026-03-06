"""
Root URL configuration for Analytics Service.
"""
from django.urls import path, include
from analytics.views import TrendingView, AnalyticsSummaryView

urlpatterns = [
    path("api/v1/urls/", include("analytics.urls")),
    path("api/v1/trending", TrendingView.as_view(), name="trending"),
    path("api/v1/analytics/summary", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("health", include("analytics.health_urls")),
]
