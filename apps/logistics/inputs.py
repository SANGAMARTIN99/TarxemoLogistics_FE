import strawberry
from typing import Optional

@strawberry.input
class CreateTruckInput:
    plate_number: str
    make: str
    model: str
    year: int
    capacity_tons: float
    capacity_cbm: Optional[float] = None
    gps_unit_id: Optional[str] = None

@strawberry.input
class CreateContainerInput:
    container_number: str
    container_type: str

@strawberry.input
class CreateJobInput:
    title: str
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    location: str
    job_type: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "KES"
    experience_years: Optional[int] = 2
    license_class: Optional[str] = "Class E"
    deadline: Optional[str] = None # format YYYY-MM-DD

@strawberry.input
class JobApplicationInput:
    job_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    license_class: str
    experience_years: int
    cover_letter: Optional[str] = ""
