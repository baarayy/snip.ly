"""
RabbitMQ consumer - runs in a background thread.
Listens on the 'click.events.queue' queue and persists events to MongoDB.
Enhanced with user-agent parsing, referrer categorization, and UTM tracking.
"""
import json
import logging
import sys
import time

import pika
from django.conf import settings
from analytics.mongo import get_db
from analytics.parsers import parse_user_agent, categorize_referrer, extract_utm_params

# Force logging to stdout so Docker can capture it
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

QUEUE_NAME = "click.events.queue"
EXCHANGE_NAME = "url.shortener.exchange"
ROUTING_KEY = "click.event"

# Global flag to ensure only one consumer runs per process
_consumer_started = False


def _on_message(ch, method, properties, body):
    """Callback for each incoming message — enhanced with rich analytics data."""
    try:
        event = json.loads(body)

        # Parse user-agent
        ua_string = event.get("userAgent", "")
        ua_info = parse_user_agent(ua_string)

        # Categorize referrer
        referrer = event.get("referrer", "")
        ref_info = categorize_referrer(referrer)

        # Extract UTM parameters
        utm = extract_utm_params(referrer)

        db = get_db()
        db.click_events.insert_one(
            {
                # Core fields
                "short_code": event.get("shortCode"),
                "timestamp": event.get("timestamp"),
                "ip_address": event.get("ipAddress"),
                "user_agent": ua_string,
                "referrer": referrer,
                "country": event.get("country", "unknown"),

                # Enhanced: Device & browser
                "device_type": ua_info["device_type"],
                "os": ua_info["os"],
                "os_version": ua_info["os_version"],
                "browser": ua_info["browser"],
                "browser_version": ua_info["browser_version"],
                "is_bot": ua_info["is_bot"],

                # Enhanced: Referrer categorization
                "referrer_category": ref_info["category"],
                "referrer_domain": ref_info["domain"],

                # Enhanced: UTM tracking
                "utm_source": utm["utm_source"],
                "utm_medium": utm["utm_medium"],
                "utm_campaign": utm["utm_campaign"],
                "utm_term": utm["utm_term"],
                "utm_content": utm["utm_content"],
            }
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(
            "Stored click event for %s [%s/%s/%s]",
            event.get("shortCode"),
            ua_info["device_type"],
            ua_info["browser"],
            ref_info["category"],
        )
    except Exception:
        logger.exception("Failed to process click event")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_consumer():
    """Connect to RabbitMQ and start consuming. Retries on failure."""
    global _consumer_started
    if _consumer_started:
        return
    _consumer_started = True

    retry_delay = 5
    while True:
        try:
            logger.info("Connecting to RabbitMQ at %s ...", settings.RABBITMQ_URL)
            sys.stdout.flush()
            params = pika.URLParameters(settings.RABBITMQ_URL)
            params.heartbeat = 600
            params.blocked_connection_timeout = 300
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

            logger.info("Analytics consumer started — waiting for click events (enhanced pipeline)")
            sys.stdout.flush()
            channel.start_consuming()
        except Exception:
            logger.exception("RabbitMQ consumer error - retrying in %ds", retry_delay)
            sys.stdout.flush()
            time.sleep(retry_delay)
