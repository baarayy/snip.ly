import logging
import threading

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AnalyticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "analytics"

    def ready(self):
        """Start the RabbitMQ consumer in a background thread when Django starts."""
        from analytics.consumer import start_consumer

        logger.info("AnalyticsConfig.ready() called — starting consumer thread")
        consumer_thread = threading.Thread(
            target=start_consumer, daemon=True, name="rabbitmq-consumer"
        )
        consumer_thread.start()
