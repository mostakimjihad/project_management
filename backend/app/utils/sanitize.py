"""Input sanitization utilities."""
import re
from typing import Optional


def sanitize_input(text: Optional[str]) -> Optional[str]:
    """Remove potentially dangerous HTML/script content.
    
    Args:
        text: Input text to sanitize
        
    Returns:
        Sanitized text with dangerous content removed
    """
    if text is None:
        return None
    
    # Remove script tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove event handlers (onclick, onload, etc.)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    # Remove javascript: URLs
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    
    # Remove data: URLs (can be used for XSS)
    text = re.sub(r'data:', '', text, flags=re.IGNORECASE)
    
    # Remove vbscript: URLs
    text = re.sub(r'vbscript:', '', text, flags=re.IGNORECASE)
    
    # Remove iframe tags
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove object/embed tags
    text = re.sub(r'<(object|embed)[^>]*>.*?</(object|embed)>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    return text.strip()


def sanitize_html(text: Optional[str]) -> Optional[str]:
    """Escape HTML special characters.
    
    Args:
        text: Input text to escape
        
    Returns:
        Text with HTML special characters escaped
    """
    if text is None:
        return None
    
    replacements = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;',
        '/': '&#x2F;',
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    return text


def truncate_text(text: Optional[str], max_length: int = 1000) -> Optional[str]:
    """Truncate text to a maximum length.
    
    Args:
        text: Input text to truncate
        max_length: Maximum allowed length
        
    Returns:
        Truncated text
    """
    if text is None:
        return None
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - 3] + '...'