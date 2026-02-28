from django.urls import path
from analytics.views import HealthView

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
]
