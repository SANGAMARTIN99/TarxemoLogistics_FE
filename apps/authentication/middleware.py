from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

class GraphQLJWTMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            auth_header = (
                request.headers.get('Authorization') or 
                request.headers.get('authorization') or 
                request.META.get('HTTP_AUTHORIZATION')
            )
            if auth_header and auth_header.startswith('Bearer '):
                # SimpleJWT authentication looks at request.META; ensure it is populated
                if 'HTTP_AUTHORIZATION' not in request.META:
                    request.META['HTTP_AUTHORIZATION'] = auth_header
                try:
                    auth = JWTAuthentication()
                    validated = auth.authenticate(request)
                    if validated:
                        request.user = validated[0]
                except Exception:
                    pass

