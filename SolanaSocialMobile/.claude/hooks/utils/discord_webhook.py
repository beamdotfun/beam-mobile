#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "requests",
# ]
# ///

import json
import requests
from datetime import datetime
from typing import Optional, Dict, Any


DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1393015853116559520/m8UViHZzwww9FIKCtzf_lGQY4dYU2w5cEinFoGhsvhmdGCuIFep3UBxORwzj4vDIKGfS"


def send_discord_notification(
    title: str,
    description: str,
    color: int = 0x5865F2,  # Discord brand color
    fields: Optional[list[Dict[str, Any]]] = None,
    footer_text: Optional[str] = None
) -> bool:
    """
    Send a notification to Discord webhook.
    
    Args:
        title: The title of the embed
        description: Main description text
        color: Embed color (hex)
        fields: Optional list of field dictionaries with 'name', 'value', and optional 'inline'
        footer_text: Optional footer text
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        embed = {
            "title": title,
            "description": description,
            "color": color,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if fields:
            embed["fields"] = fields
            
        if footer_text:
            embed["footer"] = {"text": footer_text}
        
        payload = {
            "embeds": [embed]
        }
        
        response = requests.post(
            DISCORD_WEBHOOK_URL,
            json=payload,
            timeout=5
        )
        
        return response.status_code == 204
        
    except Exception:
        return False


def send_simple_discord_message(content: str) -> bool:
    """
    Send a simple text message to Discord webhook.
    
    Args:
        content: The message content
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        payload = {
            "content": content
        }
        
        response = requests.post(
            DISCORD_WEBHOOK_URL,
            json=payload,
            timeout=5
        )
        
        return response.status_code == 204
        
    except Exception:
        return False