"""
Views for the Analytics API.
Enhanced with rich analytics data: device/OS/browser breakdowns,
referrer categorization, UTM tracking, and time-series trends.
"""
import csv
import io
import json
import logging
from datetime import datetime, timezone, timedelta

import requests
from django.http import JsonResponse, HttpResponse
from django.views import View

from analytics.mongo import get_db

logger = logging.getLogger(__name__)


class AnalyticsView(View):
    """
    GET /api/v1/urls/<shortCode>/analytics

    Returns aggregated click analytics for a given short code.
    Enhanced with device, browser, OS, referrer, and UTM breakdowns.
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
                    "clicksByDevice": {},
                    "clicksByBrowser": {},
                    "clicksByOS": {},
                    "clicksByReferrerCategory": {},
                    "topReferrerDomains": [],
                    "utmBreakdown": [],
                    "hourlyTrend": [],
                    "recentClicks": [],
                }
            )

        match_filter = {"$match": {"short_code": short_code}}

        # Clicks by country
        country_pipeline = [
            match_filter,
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        clicks_by_country = {
            doc["_id"]: doc["count"]
            for doc in collection.aggregate(country_pipeline)
        }

        # Clicks by date (day granularity)
        date_pipeline = [
            match_filter,
            {
                "$group": {
                    "_id": {"$substr": ["$timestamp", 0, 10]},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        clicks_by_date = {
            doc["_id"]: doc["count"]
            for doc in collection.aggregate(date_pipeline)
        }

        # Clicks by device type
        device_pipeline = [
            match_filter,
            {"$group": {"_id": "$device_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        clicks_by_device = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(device_pipeline)
        }

        # Clicks by browser
        browser_pipeline = [
            match_filter,
            {"$group": {"_id": "$browser", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        clicks_by_browser = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(browser_pipeline)
        }

        # Clicks by OS
        os_pipeline = [
            match_filter,
            {"$group": {"_id": "$os", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        clicks_by_os = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(os_pipeline)
        }

        # Clicks by referrer category
        referrer_cat_pipeline = [
            match_filter,
            {"$group": {"_id": "$referrer_category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        clicks_by_referrer_cat = {
            (doc["_id"] or "direct"): doc["count"]
            for doc in collection.aggregate(referrer_cat_pipeline)
        }

        # Top referrer domains
        referrer_domain_pipeline = [
            match_filter,
            {"$match": {"referrer_domain": {"$ne": ""}}},
            {"$group": {"_id": "$referrer_domain", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_referrer_domains = [
            {"domain": doc["_id"], "count": doc["count"]}
            for doc in collection.aggregate(referrer_domain_pipeline)
        ]

        # UTM breakdown
        utm_pipeline = [
            match_filter,
            {"$match": {"utm_source": {"$ne": ""}}},
            {
                "$group": {
                    "_id": {
                        "source": "$utm_source",
                        "medium": "$utm_medium",
                        "campaign": "$utm_campaign",
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        utm_breakdown = [
            {
                "source": doc["_id"]["source"],
                "medium": doc["_id"]["medium"],
                "campaign": doc["_id"]["campaign"],
                "count": doc["count"],
            }
            for doc in collection.aggregate(utm_pipeline)
        ]

        # Hourly trend (last 24 hours)
        hourly_trend = _get_hourly_trend(collection, short_code)

        # Last 10 clicks (enhanced)
        recent = list(
            collection.find(
                {"short_code": short_code},
                {
                    "_id": 0,
                    "short_code": 0,
                    "utm_term": 0,
                    "utm_content": 0,
                },
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
                "clicksByDevice": clicks_by_device,
                "clicksByBrowser": clicks_by_browser,
                "clicksByOS": clicks_by_os,
                "clicksByReferrerCategory": clicks_by_referrer_cat,
                "topReferrerDomains": top_referrer_domains,
                "utmBreakdown": utm_breakdown,
                "hourlyTrend": hourly_trend,
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
        total_pages = max(1, -(-total_items // page_size))

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


class AnalyticsExportView(View):
    """
    GET /api/v1/urls/<shortCode>/analytics/export?format=csv|json

    Export analytics data for a short code.
    """

    def get(self, request, short_code):
        export_format = request.GET.get("format", "json").lower()
        db = get_db()
        collection = db.click_events

        events = list(
            collection.find(
                {"short_code": short_code},
                {"_id": 0},
            ).sort("timestamp", -1)
        )

        if export_format == "csv":
            return self._export_csv(short_code, events)
        else:
            return self._export_json(short_code, events)

    def _export_csv(self, short_code, events):
        output = io.StringIO()
        if events:
            fieldnames = [
                "timestamp", "ip_address", "country", "device_type",
                "os", "browser", "referrer_category", "referrer_domain",
                "utm_source", "utm_medium", "utm_campaign",
            ]
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for event in events:
                writer.writerow(event)

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="analytics_{short_code}.csv"'
        return response

    def _export_json(self, short_code, events):
        data = {
            "shortCode": short_code,
            "totalClicks": len(events),
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "events": events,
        }
        response = HttpResponse(
            json.dumps(data, default=str, indent=2),
            content_type="application/json",
        )
        response["Content-Disposition"] = f'attachment; filename="analytics_{short_code}.json"'
        return response


class AnalyticsSummaryView(View):
    """
    GET /api/v1/analytics/summary?period=7d

    Returns a global summary of analytics across all short codes.
    """

    def get(self, request):
        period = request.GET.get("period", "7d")
        db = get_db()
        collection = db.click_events

        days = _parse_period(period)
        since = datetime.now(timezone.utc) - timedelta(days=days)
        since_str = since.isoformat()

        match_filter = {"timestamp": {"$gte": since_str}}

        total_clicks = collection.count_documents(match_filter)
        unique_codes = len(collection.distinct("short_code", match_filter))

        # Top devices
        device_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$device_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        top_devices = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(device_pipeline)
        }

        # Top browsers
        browser_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$browser", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_browsers = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(browser_pipeline)
        }

        # Top countries
        country_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_countries = {
            (doc["_id"] or "unknown"): doc["count"]
            for doc in collection.aggregate(country_pipeline)
        }

        # Referrer categories
        ref_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$referrer_category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        referrer_cats = {
            (doc["_id"] or "direct"): doc["count"]
            for doc in collection.aggregate(ref_pipeline)
        }

        # Daily trend
        daily_pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": {"$substr": ["$timestamp", 0, 10]},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        daily_trend = [
            {"date": doc["_id"], "clicks": doc["count"]}
            for doc in collection.aggregate(daily_pipeline)
        ]

        bot_count = collection.count_documents({**match_filter, "is_bot": True})
        bot_percentage = round((bot_count / total_clicks * 100), 2) if total_clicks > 0 else 0

        return JsonResponse({
            "period": period,
            "totalClicks": total_clicks,
            "uniqueShortCodes": unique_codes,
            "topDevices": top_devices,
            "topBrowsers": top_browsers,
            "topCountries": top_countries,
            "referrerCategories": referrer_cats,
            "dailyTrend": daily_trend,
            "botTrafficPercent": bot_percentage,
        })


class HealthView(View):
    """Health check endpoint."""

    def get(self, request):
        return JsonResponse({"status": "ok", "service": "analytics-service"})


# ─── Helpers ────────────────────────────────────────────

def _get_hourly_trend(collection, short_code):
    """Get click counts per hour for the last 24 hours."""
    now = datetime.now(timezone.utc)
    since = (now - timedelta(hours=24)).isoformat()

    pipeline = [
        {"$match": {"short_code": short_code, "timestamp": {"$gte": since}}},
        {
            "$group": {
                "_id": {"$substr": ["$timestamp", 0, 13]},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    return [
        {"hour": doc["_id"], "clicks": doc["count"]}
        for doc in collection.aggregate(pipeline)
    ]


def _parse_period(period: str) -> int:
    """Parse a period string like '7d', '30d', '24h' into days."""
    period = period.lower().strip()
    if period.endswith("d"):
        try:
            return int(period[:-1])
        except ValueError:
            return 7
    if period.endswith("h"):
        try:
            return max(1, int(period[:-1]) // 24)
        except ValueError:
            return 1
    if period.endswith("w"):
        try:
            return int(period[:-1]) * 7
        except ValueError:
            return 7
    return 7
