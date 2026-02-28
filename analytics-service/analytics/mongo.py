"""
MongoDB client singleton for the analytics service.
Uses pymongo directly – no Django ORM dependency.
"""
import logging
from pymongo import MongoClient
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

        # Ensure indexes
        _db.click_events.create_index("short_code")
        _db.click_events.create_index("timestamp")
        _db.click_events.create_index([("short_code", 1), ("timestamp", -1)])
    return _db
