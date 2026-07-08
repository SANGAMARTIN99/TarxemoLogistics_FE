import strawberry
from typing import Optional

@strawberry.input
class UpdateDriverProfileInput:
    license_number: Optional[str] = None
    license_class: Optional[str] = None
    experience_years: Optional[int] = None
    status: Optional[str] = None
