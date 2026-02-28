from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "analytics"

    def ready(self):
        """Start the RabbitMQ consumer in a background thread when Django starts."""
        import threading
        from analytics.consumer import start_consumer

        consumer_thread = threading.Thread(target=start_consumer, daemon=True)
        consumer_thread.start()
