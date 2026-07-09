import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from apps.authentication.models import User
from apps.tenants.models import Tenant, TenantPlan, TenantStatus, TenantMembership, TenantTheme
from apps.pricing.models import Quote, QuoteStatus, PricingMatrix
from apps.payments.models import Invoice, InvoiceStatus, Payment, PaymentMethod
from apps.logistics.models import Job, JobStatus, JobType, Truck, Container

def seed():
    print("Starting database seeding...")
    
    # 1. Create Carriers / Tenants
    t1, created = Tenant.objects.get_or_create(
        slug="kenfreight",
        defaults={
            "name": "Kenfreight Ltd",
            "email": "ops@kenfreight.com",
            "phone": "+254711000000",
            "address": "Mombasa Port, Sector 4",
            "country": "Kenya",
            "city": "Mombasa",
            "plan": TenantPlan.GROWTH,
            "status": TenantStatus.ACTIVE,
        }
    )
    if created:
        print(f"Created tenant: {t1.name}")
    else:
        print(f"Tenant exists: {t1.name}")

    # Set up TenantTheme if not exists
    TenantTheme.objects.get_or_create(
        tenant=t1,
        defaults={
            "primary_color": "#E8580A",
            "primary_color_dark": "#FF7A2F",
            "background_color": "#FDFBF7", # Cream
            "background_dark": "#0A0A12"
        }
    )

    t2, created = Tenant.objects.get_or_create(
        slug="bollore",
        defaults={
            "name": "Bolloré Logistics",
            "email": "eastafrica@bollore.com",
            "phone": "+255222000000",
            "address": "Dar es Salaam Port Yard",
            "country": "Tanzania",
            "city": "Dar es Salaam",
            "plan": TenantPlan.ENTERPRISE,
            "status": TenantStatus.ACTIVE,
        }
    )
    if created:
        print(f"Created tenant: {t2.name}")
    else:
        print(f"Tenant exists: {t2.name}")

    TenantTheme.objects.get_or_create(
        tenant=t2,
        defaults={
            "primary_color": "#1A56DB",
            "primary_color_dark": "#1E40AF",
            "background_color": "#FDFBF7", # Cream
            "background_dark": "#0A0A12"
        }
    )

    # 2. Seed Pricing Matrices
    PricingMatrix.objects.get_or_create(
        tenant=t1,
        source_location="Mombasa Port",
        destination_location="Kampala Central Depot",
        container_type="40FT",
        defaults={
            "base_rate": Decimal("25000.00"),
            "per_km_rate": Decimal("1.50"),
            "per_ton_rate": Decimal("1200.00")
        }
    )
    PricingMatrix.objects.get_or_create(
        tenant=t1,
        source_location="Nairobi Yard",
        destination_location="Eldoret Terminal",
        container_type="20FT",
        defaults={
            "base_rate": Decimal("15000.00"),
            "per_km_rate": Decimal("1.20"),
            "per_ton_rate": Decimal("1000.00")
        }
    )

    # 3. Associate all existing customers with both tenants (memberships)
    customers = User.objects.filter(role="CUSTOMER")
    if not customers:
        print("No customers found! Register a customer in the frontend or run test runner.")
        # Create a default customer for demonstration if none exist
        c, c_created = User.objects.get_or_create(
            email="customer@tarxemo.com",
            defaults={
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+254712345678",
                "role": "CUSTOMER",
                "is_active": True,
                "is_verified": True
            }
        )
        if c_created:
            c.set_password("Password123!")
            c.save()
            print("Created default customer customer@tarxemo.com / Password123!")
        customers = [c]

    for customer in customers:
        # Tenant memberships
        TenantMembership.objects.get_or_create(user=customer, tenant=t1, defaults={"role": "CUSTOMER"})
        TenantMembership.objects.get_or_create(user=customer, tenant=t2, defaults={"role": "CUSTOMER"})

        # Clean old shipments, quotes, invoices for this customer to ensure exact match of stats
        Job.objects.filter(customer=customer).delete()
        Quote.objects.filter(customer=customer).delete()

        # Seed 2 Active Shipment Jobs
        j1 = Job.objects.create(
            tenant=t1,
            customer=customer,
            title="Containerized Industrial Machinery",
            description="High value generator units transport from Mombasa to Kampala",
            location="Mombasa Port to Kampala Central Depot",
            job_type=JobType.CONTRACT,
            salary_min=Decimal("245000.00"),
            salary_max=Decimal("250000.00"),
            currency="KES",
            status=JobStatus.IN_TRANSIT,
            deadline=date.today() + timedelta(days=2)
        )
        j2 = Job.objects.create(
            tenant=t1,
            customer=customer,
            title="Agricultural Commodities Dispatch",
            description="Wheat grains delivery to Eldoret millers",
            location="Nairobi Yard to Eldoret Terminal",
            job_type=JobType.CONTRACT,
            salary_min=Decimal("130000.00"),
            salary_max=Decimal("135000.00"),
            currency="KES",
            status=JobStatus.CONFIRMED,
            deadline=date.today() + timedelta(days=5)
        )

        # Seed 6 Completed Shipment Jobs
        completed_routes = [
            ("Mombasa Port to Nairobi Yard", Decimal("110000.00")),
            ("Nairobi Yard to Nakuru Hub", Decimal("95000.00")),
            ("Mombasa Port to Kisumu Depot", Decimal("180000.00")),
            ("Dar es Salaam Port to Kigali Terminal", Decimal("320000.00")),
            ("Nairobi Yard to Kampala Central Depot", Decimal("210000.00")),
            ("Mombasa Port to Eldoret Terminal", Decimal("150000.00")),
        ]
        for idx, (loc, rate) in enumerate(completed_routes):
            Job.objects.create(
                tenant=t1 if "Mombasa" in loc or "Nairobi" in loc else t2,
                customer=customer,
                title=f"Delivered Shipment Cargo #{idx+1}",
                description=f"Cargo transit corridor operation on {loc}",
                location=loc,
                job_type=JobType.CONTRACT,
                salary_min=rate,
                salary_max=rate,
                currency="KES",
                status=JobStatus.DELIVERED,
                deadline=date.today() - timedelta(days=idx + 3)
            )

        # Seed 1 Pending Quote
        Quote.objects.create(
            tenant=t1,
            customer=customer,
            pickup_location="Mombasa Port",
            delivery_location="Kampala Central Depot",
            weight_tons=Decimal("24.50"),
            container_type="40FT",
            cargo_details="Electrical grid equipment & transformers",
            estimated_price=Decimal("275000.00"),
            status=QuoteStatus.PENDING
        )

        # Seed Invoices for Jobs
        # Unpaid invoice for Active Job 1
        i1 = Invoice.objects.create(
            tenant=t1,
            trip=j1,
            customer=customer,
            amount=Decimal("245000.00"),
            status=InvoiceStatus.UNPAID,
            due_date=date.today() + timedelta(days=14)
        )
        
        # Unpaid invoice for Active Job 2
        i2 = Invoice.objects.create(
            tenant=t1,
            trip=j2,
            customer=customer,
            amount=Decimal("130000.00"),
            status=InvoiceStatus.UNPAID,
            due_date=date.today() + timedelta(days=21)
        )

        # Paid invoices for Completed Jobs
        completed_jobs = Job.objects.filter(customer=customer, status=JobStatus.DELIVERED)
        for job in completed_jobs:
            inv = Invoice.objects.create(
                tenant=job.tenant,
                trip=job,
                customer=customer,
                amount=job.salary_min,
                status=InvoiceStatus.PAID,
                due_date=date.today() - timedelta(days=1)
            )
            # Create matching payment
            Payment.objects.create(
                invoice=inv,
                transaction_id=f"TXN-{str(inv.id)[:8].upper()}",
                payment_method=PaymentMethod.BANK_TRANSFER,
                amount=inv.amount
            )

    print("Seeding completed successfully!")

if __name__ == '__main__':
    seed()
