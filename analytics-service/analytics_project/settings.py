"""
Django settings for the Analytics Service.
Uses MongoDB (via pymongo directly) for storing click events.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-local-dev-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "corsheaders",
    "analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = "analytics_project.urls"

# We use pymongo directly instead of Django ORM for MongoDB.
# No DATABASES setting needed – we manage the connection manually.
DATABASES = {}

MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb://urlshortener:urlshortener@localhost:27017/analytics?authSource=admin",
)

RABBITMQ_URL = os.environ.get(
    "RABBITMQ_URL",
    "amqp://urlshortener:urlshortener@localhost:5672",
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_TZ = True
