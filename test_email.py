import os
import sys
import django

sys.path.append('/media/mastesa/62125785-5111-44aa-8957-f426a89276b2/Projects/Personal/TarxemoLogistics/Logistics_BE')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.mail import send_mail

try:
    print("Sending test email...")
    res = send_mail(
        "Test Subject",
        "This is a test message from the testing script.",
        "noreply@tarxemo.com",
        ["testrunner1@tarxemo.com"],
        fail_silently=False,
    )
    print("Send result:", res)
except Exception as e:
    print("Exception during send:", e)
