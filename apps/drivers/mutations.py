import strawberry
from strawberry.types import Info
from .models import DriverProfile
from .inputs import UpdateDriverProfileInput
from .outputs import DriverProfileType

@strawberry.type
class DriversMutation:
    @strawberry.mutation
    def update_driver_profile(self, info: Info, input: UpdateDriverProfileInput) -> DriverProfileType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        profile, created = DriverProfile.objects.get_or_create(user=user)
        
        if input.license_number is not None:
            profile.license_number = input.license_number
        if input.license_class is not None:
            profile.license_class = input.license_class
        if input.experience_years is not None:
            profile.experience_years = input.experience_years
        if input.status is not None:
            profile.status = input.status

        profile.save()
        return profile
