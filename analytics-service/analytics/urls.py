from django.urls import path
from analytics.views import AnalyticsView, AnalyticsExportView

urlpatterns = [
    path("<str:short_code>/analytics", AnalyticsView.as_view(), name="analytics"),
    path("<str:short_code>/analytics/export", AnalyticsExportView.as_view(), name="analytics-export"),
]
