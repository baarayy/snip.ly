"""
User-agent parsing and referrer categorization utilities
for the enhanced analytics pipeline.
"""
import re
from urllib.parse import urlparse, parse_qs

# ─── User-Agent Parsing ──────────────────────────────────

def parse_user_agent(ua_string: str) -> dict:
    """
    Parse a user-agent string into device type, OS, and browser info.
    Uses the user_agents library for accurate parsing.
    """
    if not ua_string or ua_string == "unknown":
        return {
            "device_type": "unknown",
            "os": "unknown",
            "os_version": "",
            "browser": "unknown",
            "browser_version": "",
            "is_bot": False,
        }

    try:
        from user_agents import parse as ua_parse
        ua = ua_parse(ua_string)

        # Determine device type
        if ua.is_mobile:
            device_type = "mobile"
        elif ua.is_tablet:
            device_type = "tablet"
        elif ua.is_pc:
            device_type = "desktop"
        elif ua.is_bot:
            device_type = "bot"
        else:
            device_type = "other"

        return {
            "device_type": device_type,
            "os": ua.os.family or "unknown",
            "os_version": ua.os.version_string or "",
            "browser": ua.browser.family or "unknown",
            "browser_version": ua.browser.version_string or "",
            "is_bot": ua.is_bot,
        }
    except Exception:
        return {
            "device_type": "unknown",
            "os": "unknown",
            "os_version": "",
            "browser": "unknown",
            "browser_version": "",
            "is_bot": False,
        }


# ─── Referrer Categorization ────────────────────────────

# Major referrer categories
SOCIAL_DOMAINS = {
    "facebook.com", "fb.com", "fb.me", "m.facebook.com",
    "twitter.com", "t.co", "x.com",
    "linkedin.com", "lnkd.in",
    "instagram.com",
    "reddit.com", "old.reddit.com",
    "pinterest.com", "pin.it",
    "tiktok.com",
    "youtube.com", "youtu.be",
    "snapchat.com",
    "tumblr.com",
    "mastodon.social",
    "threads.net",
}

SEARCH_DOMAINS = {
    "google.com", "google.co.uk", "google.de", "google.fr",
    "bing.com",
    "yahoo.com", "search.yahoo.com",
    "duckduckgo.com",
    "baidu.com",
    "yandex.com", "yandex.ru",
    "ecosia.org",
    "startpage.com",
}

EMAIL_DOMAINS = {
    "mail.google.com", "outlook.live.com", "outlook.office365.com",
    "mail.yahoo.com", "webmail",
}

MESSAGING_DOMAINS = {
    "slack.com", "discord.com", "discordapp.com",
    "telegram.org", "web.telegram.org",
    "whatsapp.com", "web.whatsapp.com",
    "teams.microsoft.com",
}


def categorize_referrer(referrer: str) -> dict:
    """
    Categorize a referrer URL into a category and extract the domain.
    """
    if not referrer or referrer == "unknown" or referrer.strip() == "":
        return {"category": "direct", "domain": ""}

    try:
        parsed = urlparse(referrer)
        domain = parsed.hostname or ""
        domain = domain.lower().lstrip("www.")

        # Check categories
        if any(d in domain for d in SOCIAL_DOMAINS):
            return {"category": "social", "domain": domain}
        if any(d in domain for d in SEARCH_DOMAINS):
            return {"category": "search", "domain": domain}
        if any(d in domain for d in EMAIL_DOMAINS):
            return {"category": "email", "domain": domain}
        if any(d in domain for d in MESSAGING_DOMAINS):
            return {"category": "messaging", "domain": domain}

        return {"category": "referral", "domain": domain}
    except Exception:
        return {"category": "unknown", "domain": ""}


# ─── UTM Parameter Extraction ───────────────────────────

def extract_utm_params(referrer: str) -> dict:
    """
    Extract UTM parameters from a referrer URL.
    """
    utm = {
        "utm_source": "",
        "utm_medium": "",
        "utm_campaign": "",
        "utm_term": "",
        "utm_content": "",
    }

    if not referrer:
        return utm

    try:
        parsed = urlparse(referrer)
        params = parse_qs(parsed.query)
        for key in utm:
            if key in params:
                utm[key] = params[key][0]
    except Exception:
        pass

    return utm
