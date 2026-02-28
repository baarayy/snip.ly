"""
RabbitMQ consumer – runs in a background thread.
Listens on the 'click.events.queue' queue and persists events to MongoDB.
"""
import json
import logging
import time

import pika
from django.conf import settings
from analytics.mongo import get_db

logger = logging.getLogger(__name__)

QUEUE_NAME = "click.events.queue"
EXCHANGE_NAME = "url.shortener.exchange"
ROUTING_KEY = "click.event"


def _on_message(ch, method, properties, body):
    """Callback for each incoming message."""
    try:
        event = json.loads(body)
        db = get_db()
        db.click_events.insert_one(
            {
                "short_code": event.get("shortCode"),
                "timestamp": event.get("timestamp"),
                "ip_address": event.get("ipAddress"),
                "user_agent": event.get("userAgent"),
                "referrer": event.get("referrer"),
                "country": event.get("country", "unknown"),
            }
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.debug("Stored click event for %s", event.get("shortCode"))
    except Exception:
        logger.exception("Failed to process click event")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_consumer():
    """Connect to RabbitMQ and start consuming. Retries on failure."""
    while True:
        try:
            params = pika.URLParameters(settings.RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.exchange_declare(
                exchange=EXCHANGE_NAME, exchange_type="topic", durable=True
            )
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.queue_bind(
                exchange=EXCHANGE_NAME,
                queue=QUEUE_NAME,
                routing_key=ROUTING_KEY,
            )
            channel.basic_qos(prefetch_count=10)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=_on_message)

            logger.info("Analytics consumer started – waiting for click events…")
            channel.start_consuming()
        except Exception:
            logger.exception("RabbitMQ consumer crashed – restarting in 5s")
            time.sleep(5)
