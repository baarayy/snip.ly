"""
Views for the Analytics API.
"""
import logging
from datetime import datetime, timezone

import requests
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


class TrendingView(View):
    """
    GET /api/v1/trending?page=1&pageSize=20

    Returns paginated trending short URLs with their metadata.
    Aggregates from MongoDB click_events, then enriches with
    longUrl from the url-service.
    """

    URL_SERVICE_BASE = "http://url-service:8081"

    def get(self, request):
        page = max(int(request.GET.get("page", 1)), 1)
        page_size = min(max(int(request.GET.get("pageSize", 20)), 1), 100)
        db = get_db()
        collection = db.click_events

        # Count total distinct short codes
        distinct_codes = collection.distinct("short_code")
        total_items = len(distinct_codes)
        total_pages = max(1, -(-total_items // page_size))  # ceil division

        skip = (page - 1) * page_size

        # Aggregate top short codes by click count with pagination
        pipeline = [
            {"$group": {"_id": "$short_code", "totalClicks": {"$sum": 1}}},
            {"$sort": {"totalClicks": -1}},
            {"$skip": skip},
            {"$limit": page_size},
        ]
        top_codes = list(collection.aggregate(pipeline))

        if not top_codes:
            return JsonResponse({
                "trending": [],
                "total": total_items,
                "page": page,
                "pageSize": page_size,
                "totalPages": total_pages,
                "hasNext": False,
                "hasPrev": page > 1,
            })

        # Enrich each with longUrl from url-service
        trending = []
        for doc in top_codes:
            short_code = doc["_id"]
            clicks = doc["totalClicks"]

            # Try to fetch the original URL from url-service
            long_url = None
            try:
                resp = requests.get(
                    f"{self.URL_SERVICE_BASE}/api/v1/urls/{short_code}",
                    timeout=3,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    long_url = data.get("longUrl")
            except Exception:
                logger.warning("Could not fetch longUrl for %s", short_code)

            trending.append(
                {
                    "shortCode": short_code,
                    "longUrl": long_url,
                    "totalClicks": clicks,
                    "rank": skip + len(trending) + 1,
                }
            )

        return JsonResponse({
            "trending": trending,
            "total": total_items,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1,
        })


class HealthView(View):
    """Health check endpoint."""

    def get(self, request):
        return JsonResponse({"status": "ok", "service": "analytics-service"})
