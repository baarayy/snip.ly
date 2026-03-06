"""
MongoDB client singleton for the analytics service.
Uses pymongo directly – no Django ORM dependency.
Enhanced with indexes for device/browser/referrer analytics.
"""
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from django.conf import settings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """Return (and lazily create) the MongoDB database handle."""
    global _client, _db
    if _db is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.get_default_database()
        logger.info("Connected to MongoDB: %s", _db.name)

        # Core indexes
        _db.click_events.create_index("short_code")
        _db.click_events.create_index("timestamp")
        _db.click_events.create_index([("short_code", ASCENDING), ("timestamp", DESCENDING)])

        # Enhanced analytics indexes
        _db.click_events.create_index("device_type")
        _db.click_events.create_index("browser")
        _db.click_events.create_index("os")
        _db.click_events.create_index("referrer_category")
        _db.click_events.create_index("referrer_domain")
        _db.click_events.create_index("utm_source")
        _db.click_events.create_index("utm_campaign")
        _db.click_events.create_index("country")
        _db.click_events.create_index("is_bot")

        # Compound indexes for common queries
        _db.click_events.create_index([("short_code", ASCENDING), ("device_type", ASCENDING)])
        _db.click_events.create_index([("short_code", ASCENDING), ("browser", ASCENDING)])
        _db.click_events.create_index([("short_code", ASCENDING), ("referrer_category", ASCENDING)])

    return _db
