import requests
import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from django.utils.html import linebreaks

logger = logging.getLogger(__name__)

class EmailAPIBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
            
        api_url = getattr(settings, "EMAIL_API_URL", "https://emailbackend.tarxemo.com/api/v1/send-email/")
        api_key = getattr(settings, "EMAIL_API_KEY", "")
        api_secret = getattr(settings, "EMAIL_API_SECRET", "")
        
        headers = {
            "Content-Type": "application/json",
            "X-API-KEY": api_key,
            "X-API-SECRET": api_secret,
        }
        
        num_sent = 0
        for message in email_messages:
            # Send to each recipient individually as per API docs
            for recipient in message.to:
                html_body = self._get_html_body(message)
                
                payload = {
                    "recipient": recipient,
                    "subject": message.subject,
                    "html_body": html_body
                }
                
                try:
                    response = requests.post(api_url, json=payload, headers=headers, timeout=10)
                    response.raise_for_status()
                    num_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send email to {recipient} via EmailAPI: {e}")
                    if not self.fail_silently:
                        raise e
                        
        return num_sent
        
    def _get_html_body(self, message):
        # EmailMultiAlternatives support for html body
        if hasattr(message, "alternatives"):
            for content, mimetype in message.alternatives:
                if mimetype == "text/html":
                    return content
        
        # Fallback to plain body but wrap newlines in <br> so it looks nice as HTML
        # if the service expects HTML
        body = getattr(message, "body", "")
        return linebreaks(body)
