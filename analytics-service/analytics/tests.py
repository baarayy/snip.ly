"""
Tests for the Analytics API views.
"""
from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase, RequestFactory
from analytics.views import AnalyticsView, TrendingView, HealthView


class AnalyticsViewTest(SimpleTestCase):
    """Tests for GET /api/v1/urls/<shortCode>/analytics"""

    def setUp(self):
        self.factory = RequestFactory()

    @patch("analytics.views.get_db")
    def test_analytics_returns_zero_clicks(self, mock_get_db):
        """When no click events exist, return zero totalClicks."""
        mock_collection = MagicMock()
        mock_collection.count_documents.return_value = 0
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        request = self.factory.get("/api/v1/urls/abc1234/analytics")
        response = AnalyticsView.as_view()(request, short_code="abc1234")

        self.assertEqual(response.status_code, 200)
        data = self._json(response)
        self.assertEqual(data["shortCode"], "abc1234")
        self.assertEqual(data["totalClicks"], 0)
        self.assertEqual(data["clicksByCountry"], {})
        self.assertEqual(data["clicksByDate"], {})
        self.assertEqual(data["recentClicks"], [])

    @patch("analytics.views.get_db")
    def test_analytics_returns_aggregated_data(self, mock_get_db):
        """When click events exist, aggregate and return them."""
        mock_collection = MagicMock()
        mock_collection.count_documents.return_value = 42
        mock_collection.aggregate.side_effect = [
            # clicksByCountry pipeline
            iter([{"_id": "US", "count": 30}, {"_id": "DE", "count": 12}]),
            # clicksByDate pipeline
            iter([{"_id": "2024-01-15", "count": 20}, {"_id": "2024-01-16", "count": 22}]),
        ]
        # recent clicks cursor (chained .sort().limit())
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.limit.return_value = [
            {"timestamp": "2024-01-16T10:00:00Z", "ip_address": "1.2.3.4"},
        ]
        mock_collection.find.return_value = mock_cursor

        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        request = self.factory.get("/api/v1/urls/abc1234/analytics")
        response = AnalyticsView.as_view()(request, short_code="abc1234")

        self.assertEqual(response.status_code, 200)
        data = self._json(response)
        self.assertEqual(data["totalClicks"], 42)
        self.assertEqual(data["clicksByCountry"], {"US": 30, "DE": 12})
        self.assertEqual(data["clicksByDate"], {"2024-01-15": 20, "2024-01-16": 22})
        self.assertEqual(len(data["recentClicks"]), 1)

    @staticmethod
    def _json(response):
        import json
        return json.loads(response.content)


class TrendingViewTest(SimpleTestCase):
    """Tests for GET /api/v1/trending"""

    def setUp(self):
        self.factory = RequestFactory()

    @patch("analytics.views.get_db")
    def test_trending_empty(self, mock_get_db):
        """When no click events exist, return empty trending list."""
        mock_collection = MagicMock()
        mock_collection.distinct.return_value = []
        mock_collection.aggregate.return_value = iter([])
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        request = self.factory.get("/api/v1/trending")
        response = TrendingView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        data = self._json(response)
        self.assertEqual(data["trending"], [])
        self.assertEqual(data["total"], 0)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["pageSize"], 20)
        self.assertEqual(data["totalPages"], 1)
        self.assertFalse(data["hasNext"])
        self.assertFalse(data["hasPrev"])

    @patch("analytics.views.requests.get")
    @patch("analytics.views.get_db")
    def test_trending_returns_enriched_data(self, mock_get_db, mock_http_get):
        """Trending returns top codes enriched with longUrl."""
        mock_collection = MagicMock()
        mock_collection.distinct.return_value = ["abc1234", "xyz9876"]
        mock_collection.aggregate.return_value = iter([
            {"_id": "abc1234", "totalClicks": 100},
            {"_id": "xyz9876", "totalClicks": 50},
        ])
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        # url-service HTTP enrichment
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"longUrl": "https://example.com"}
        mock_http_get.return_value = mock_resp

        request = self.factory.get("/api/v1/trending?page=1&pageSize=5")
        response = TrendingView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        data = self._json(response)
        self.assertEqual(data["total"], 2)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["pageSize"], 5)
        self.assertEqual(data["totalPages"], 1)
        self.assertFalse(data["hasNext"])
        self.assertFalse(data["hasPrev"])
        self.assertEqual(data["trending"][0]["shortCode"], "abc1234")
        self.assertEqual(data["trending"][0]["totalClicks"], 100)
        self.assertEqual(data["trending"][0]["longUrl"], "https://example.com")
        self.assertEqual(data["trending"][0]["rank"], 1)
        self.assertEqual(data["trending"][1]["rank"], 2)

    @patch("analytics.views.requests.get")
    @patch("analytics.views.get_db")
    def test_trending_graceful_when_url_service_down(self, mock_get_db, mock_http_get):
        """When url-service is unreachable, longUrl should be None."""
        mock_collection = MagicMock()
        mock_collection.distinct.return_value = ["abc1234"]
        mock_collection.aggregate.return_value = iter([
            {"_id": "abc1234", "totalClicks": 10},
        ])
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        mock_http_get.side_effect = Exception("Connection refused")

        request = self.factory.get("/api/v1/trending")
        response = TrendingView.as_view()(request)

        data = self._json(response)
        self.assertIsNone(data["trending"][0]["longUrl"])

    @patch("analytics.views.get_db")
    def test_trending_pagesize_capped_at_100(self, mock_get_db):
        """pageSize parameter should be capped at 100."""
        mock_collection = MagicMock()
        mock_collection.distinct.return_value = []
        mock_collection.aggregate.return_value = iter([])
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        request = self.factory.get("/api/v1/trending?pageSize=999")
        TrendingView.as_view()(request)

        # Verify the pipeline $limit was capped at 100
        pipeline = mock_collection.aggregate.call_args[0][0]
        limit_stage = [s for s in pipeline if "$limit" in s]
        self.assertEqual(limit_stage[0]["$limit"], 100)

    @patch("analytics.views.requests.get")
    @patch("analytics.views.get_db")
    def test_trending_pagination_page2(self, mock_get_db, mock_http_get):
        """Page 2 should skip items and report correct hasPrev/hasNext."""
        mock_collection = MagicMock()
        # 3 distinct codes, pageSize=2 → 2 pages
        mock_collection.distinct.return_value = ["a", "b", "c"]
        mock_collection.aggregate.return_value = iter([
            {"_id": "c", "totalClicks": 5},
        ])
        mock_db = MagicMock()
        mock_db.click_events = mock_collection
        mock_get_db.return_value = mock_db

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"longUrl": "https://c.com"}
        mock_http_get.return_value = mock_resp

        request = self.factory.get("/api/v1/trending?page=2&pageSize=2")
        response = TrendingView.as_view()(request)

        data = self._json(response)
        self.assertEqual(data["page"], 2)
        self.assertEqual(data["pageSize"], 2)
        self.assertEqual(data["totalPages"], 2)
        self.assertTrue(data["hasPrev"])
        self.assertFalse(data["hasNext"])
        # rank should be 3 (skip=2, first item on page 2)
        self.assertEqual(data["trending"][0]["rank"], 3)

        # Verify $skip was 2
        pipeline = mock_collection.aggregate.call_args[0][0]
        skip_stage = [s for s in pipeline if "$skip" in s]
        self.assertEqual(skip_stage[0]["$skip"], 2)

    @staticmethod
    def _json(response):
        import json
        return json.loads(response.content)


class HealthViewTest(SimpleTestCase):
    """Tests for GET /health"""

    def setUp(self):
        self.factory = RequestFactory()

    def test_health_returns_ok(self):
        request = self.factory.get("/health")
        response = HealthView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        import json
        data = json.loads(response.content)
        self.assertEqual(data["status"], "ok")
