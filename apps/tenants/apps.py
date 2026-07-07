"""
apps.tenants — App Config
"""
from django.apps import AppConfig


class TenantsConfig(AppConfig):
    name = "apps.tenants"
    label = "tenants"
    verbose_name = "Multi-Tenancy"
