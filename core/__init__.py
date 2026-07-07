"""
Tarxemo Logistics — Core Package Init
Loads Celery when Django starts (required for Celery beat)
"""
from .celery import app as celery_app

__all__ = ("celery_app",)
