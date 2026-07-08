import strawberry

@strawberry.input
class MarkReadInput:
    notification_id: str
