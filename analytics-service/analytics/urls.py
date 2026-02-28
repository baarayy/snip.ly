from django.urls import path
from analytics.views import AnalyticsView

urlpatterns = [
    path("<str:short_code>/analytics", AnalyticsView.as_view(), name="analytics"),
]
