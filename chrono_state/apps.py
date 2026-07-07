"""
chrono_state — Django App Configuration
"""
from django.apps import AppConfig


class ChronoStateConfig(AppConfig):
    name = "chrono_state"
    verbose_name = "Chrono State — Time-Travel"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        """Connect signals when app is ready."""
        import chrono_state.signals  # noqa: F401
