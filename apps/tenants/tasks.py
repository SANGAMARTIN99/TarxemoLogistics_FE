"""
apps.tenants.tasks — Celery Tasks for Tenant Management
"""
import logging
import dns.resolver
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def verify_domain_dns(self, domain_id: str):
    """
    Async DNS TXT record verification for a custom tenant domain.
    Retries up to 3 times with 5-minute intervals.
    """
    from apps.tenants.models import TenantDomain

    try:
        domain_obj = TenantDomain.objects.get(id=domain_id)
    except TenantDomain.DoesNotExist:
        logger.error(f"Domain {domain_id} not found for DNS verification.")
        return

    expected_txt = domain_obj.get_dns_txt_value()

    try:
        answers = dns.resolver.resolve(domain_obj.domain, "TXT")
        txt_records = [str(rdata).strip('"') for rdata in answers]

        if expected_txt in txt_records:
            domain_obj.status = TenantDomain.DomainStatus.VERIFIED
            domain_obj.verified_at = timezone.now()
            domain_obj.save(update_fields=["status", "verified_at"])
            logger.info(f"Domain {domain_obj.domain} verified successfully.")
        else:
            domain_obj.status = TenantDomain.DomainStatus.FAILED
            domain_obj.save(update_fields=["status"])
            logger.warning(f"Domain {domain_obj.domain} verification failed. TXT record not found.")

    except Exception as exc:
        logger.error(f"DNS lookup failed for {domain_obj.domain}: {exc}")
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            domain_obj.status = TenantDomain.DomainStatus.FAILED
            domain_obj.save(update_fields=["status"])
