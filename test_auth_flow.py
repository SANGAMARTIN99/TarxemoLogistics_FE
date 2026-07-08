import os
import sys
import django

sys.path.append('/media/mastesa/62125785-5111-44aa-8957-f426a89276b2/Projects/Personal/TarxemoLogistics/Logistics_BE')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from apps.authentication.models import User, EmailVerificationToken
# Wait, we are using Strawberry GraphQL. We can use the strawberry schema directly to execute.
from mainschema import schema

def test_auth():
    print("Testing Registration...")
    email = "testrunner1@tarxemo.com"
    password = "Password123!"
    
    # Delete if exists
    User.objects.filter(email=email).delete()

    register_mutation = f"""
    mutation {{
        register(input: {{
            email: "{email}",
            password: "{password}",
            confirmPassword: "{password}",
            firstName: "Test",
            lastName: "Runner",
            phoneNumber: "254712345678"
        }}) {{
            success
            message
        }}
    }}
    """
    
    # Run registration
    result = schema.execute_sync(register_mutation)
    print("Register Result:", result.data, result.errors)
    
    if result.errors:
        print("Registration failed!")
        return
        
    print("\nFetching Verification Token...")
    user = User.objects.get(email=email)
    print(f"User created: {user}, Verified: {user.is_verified}")
    
    token_obj = EmailVerificationToken.objects.filter(user=user).last()
    if not token_obj:
        print("No verification token found!")
        return
        
    print(f"Token: {token_obj.token}")
    
    print("\nTesting Email Verification...")
    verify_mutation = f"""
    mutation {{
        verifyEmail(token: "{token_obj.token}") {{
            success
            message
        }}
    }}
    """
    verify_result = schema.execute_sync(verify_mutation)
    print("Verify Result:", verify_result.data, verify_result.errors)
    
    # Refresh user
    user.refresh_from_db()
    print(f"User Verified Status: {user.is_verified}")
    
    print("\nTesting Login...")
    login_mutation = f"""
    mutation {{
        login(input: {{
            email: "{email}",
            password: "{password}"
        }}) {{
            ... on AuthTokensType {{
                accessToken
                refreshToken
                user {{
                    email
                    isVerified
                }}
            }}
            ... on LoginError {{
                message
                code
            }}
        }}
    }}
    """
    login_result = schema.execute_sync(login_mutation)
    print("Login Result:", login_result.data, login_result.errors)

if __name__ == "__main__":
    test_auth()
