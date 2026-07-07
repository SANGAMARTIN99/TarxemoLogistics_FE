"""
chrono_state — Time-Travel Database Library
==========================================
Enables any Django model to be queried at any point in the past.

Usage:
    class MyModel(ChronoModel):
        name = models.CharField(max_length=100)

    # Query past state:
    MyModel.objects.at("2025-06-01 12:00:00").all()

    # GraphQL (automatic via ChronoGraphQLMixin):
    { myModels(asOf: "2025-06-01T12:00:00Z") { name } }
"""
default_app_config = "chrono_state.apps.ChronoStateConfig"
