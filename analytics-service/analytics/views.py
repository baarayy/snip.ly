"""
Views for the Analytics API.
"""
import logging
from datetime import datetime, timezone

from django.http import JsonResponse
from django.views import View

from analytics.mongo import get_db

logger = logging.getLogger(__name__)


class AnalyticsView(View):
    """
    GET /api/v1/urls/<shortCode>/analytics

    Returns aggregated click analytics for a given short code.
    """

    def get(self, request, short_code):
        db = get_db()
        collection = db.click_events

        # Total clicks
        total_clicks = collection.count_documents({"short_code": short_code})

        if total_clicks == 0:
            return JsonResponse(
                {
                    "shortCode": short_code,
                    "totalClicks": 0,
                    "clicksByCountry": {},
                    "clicksByDate": {},
                    "recentClicks": [],
                }
            )

        # Clicks by country
        country_pipeline = [
            {"$match": {"short_code": short_code}},
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        clicks_by_country = {
            doc["_id"]: doc["count"]
            for doc in collection.aggregate(country_pipeline)
        }

        # Clicks by date (day granularity)
        date_pipeline = [
            {"$match": {"short_code": short_code}},
            {
                "$group": {
                    "_id": {
                        "$substr": ["$timestamp", 0, 10]  # YYYY-MM-DD
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        clicks_by_date = {
            doc["_id"]: doc["count"]
            for doc in collection.aggregate(date_pipeline)
        }

        # Last 10 clicks
        recent = list(
            collection.find(
                {"short_code": short_code},
                {"_id": 0, "short_code": 0},
            )
            .sort("timestamp", -1)
            .limit(10)
        )

        return JsonResponse(
            {
                "shortCode": short_code,
                "totalClicks": total_clicks,
                "clicksByCountry": clicks_by_country,
                "clicksByDate": clicks_by_date,
                "recentClicks": recent,
            }
        )


class HealthView(View):
    """Health check endpoint."""

    def get(self, request):
        return JsonResponse({"status": "ok", "service": "analytics-service"})
