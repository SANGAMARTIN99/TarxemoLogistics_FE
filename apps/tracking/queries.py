import strawberry
import urllib.request
import json
from typing import List, Optional
from strawberry.types import Info
from django.conf import settings
from apps.logistics.models import Job
from .models import LocationLog
from .outputs import (
    LocationLogType, ShipmentTrackingType, ShipmentTrackingDriverType,
    ShipmentTrackingMilestoneType, ShipmentTrackingLocationLogType
)

def _fetch_osrm_route(p_lat: float, p_lng: float, d_lat: float, d_lng: float) -> List[dict]:
    url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{p_lng},{p_lat};{d_lng},{d_lat}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Tarxemo Logistics Platform'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("code") == "Ok" and data.get("routes"):
                coords = data["routes"][0]["geometry"]["coordinates"]
                return [{"lat": float(c[1]), "lng": float(c[0])} for c in coords]
    except Exception as e:
        import logging
        logging.getLogger("tracking").error(f"OSRM Route API request failed: {e}")
    
    # Fallback to straight line (15 interpolation steps)
    coords = []
    steps = 15
    for i in range(steps + 1):
        t = i / steps
        lat = p_lat + (d_lat - p_lat) * t
        lng = p_lng + (d_lng - p_lng) * t
        coords.append({"lat": lat, "lng": lng})
    return coords


@strawberry.type
class TrackingQuery:
    @strawberry.field
    def trip_location_logs(self, info: Info, trip_id: str) -> List[LocationLogType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        return list(LocationLog.objects.filter(trip_id=trip_id).order_by("timestamp"))

    @strawberry.field
    def shipment_tracking(self, info: Info, shipment_id: str) -> Optional[ShipmentTrackingType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        try:
            job = Job.objects.get(id=shipment_id)
        except Job.DoesNotExist:
            return None

        p_lat = float(job.pickup_lat) if job.pickup_lat else -6.8160
        p_lng = float(job.pickup_lng) if job.pickup_lng else 39.2803
        d_lat = float(job.delivery_lat) if job.delivery_lat else -8.9000
        d_lng = float(job.delivery_lng) if job.delivery_lng else 33.4600

        pickup_name = job.location.split(" to ")[0] if " to " in job.location else "Dar es Salaam Port"
        delivery_name = job.location.split(" to ")[1] if " to " in job.location else "Mbeya Terminal"

        driver_obj = job.assigned_driver
        if driver_obj:
            driver_data = ShipmentTrackingDriverType(
                id=str(driver_obj.id),
                first_name=driver_obj.first_name or "James",
                last_name=driver_obj.last_name or "Mwangi",
                phone=driver_obj.phone or "+255 712 345 678",
                rating=4.8,
                vehicle_plate=job.assigned_truck.plate_number if job.assigned_truck else "T 123 ABC"
            )
        else:
            driver_data = ShipmentTrackingDriverType(
                id="default-driver",
                first_name="James",
                last_name="Mwangi",
                phone="+255 712 345 678",
                rating=4.8,
                vehicle_plate="T 123 ABC"
            )

        def lerp(a, b, t):
            return a + (b - a) * t

        milestone_definitions = [
            {"name": pickup_name, "t": 0.0, "desc": "Cargo loaded and dispatched"},
            {"name": "Morogoro Checkpoint", "t": 0.25, "desc": "Checkpoint cleared, documents verified"},
            {"name": "Dodoma Junction", "t": 0.50, "desc": "Route transit check point"},
            {"name": "Iringa Weighbridge", "t": 0.75, "desc": "Vehicle weight verification"},
            {"name": delivery_name, "t": 1.0, "desc": "Final destination — unloading dock"}
        ]

        milestones = []
        for i, definition in enumerate(milestone_definitions):
            t = definition["t"]
            m_lat = lerp(p_lat, d_lat, t)
            m_lng = lerp(p_lng, d_lng, t)

            status = "PENDING"
            actual_time = None
            if job.status == "DELIVERED":
                status = "PASSED"
                actual_time = "2026-07-10 14:00"
            elif job.status in ("IN_TRANSIT", "CONFIRMED"):
                if t == 0.0:
                    status = "PASSED"
                    actual_time = "2026-07-10 08:00"
                elif t == 0.25:
                    status = "PASSED"
                    actual_time = "2026-07-10 11:30"
                elif t == 0.50:
                    status = "CURRENT"
                else:
                    status = "PENDING"
            else:
                if t == 0.0:
                    status = "CURRENT"
                else:
                    status = "PENDING"

            milestones.append(
                ShipmentTrackingMilestoneType(
                    id=f"ms-{i}",
                    location=definition["name"],
                    lat=m_lat,
                    lng=m_lng,
                    estimated_time="2026-07-10 16:00",
                    actual_time=actual_time,
                    status=status,
                    description=definition["desc"]
                )
            )

        latest_log = job.location_logs.first()
        if latest_log:
            c_lat = float(latest_log.latitude)
            c_lng = float(latest_log.longitude)
            c_loc = "GPS Broadcasting Position"
        else:
            current_ms = next((m for m in milestones if m.status == "CURRENT"), milestones[0])
            c_lat = current_ms.lat
            c_lng = current_ms.lng
            c_loc = current_ms.location

        logs = []
        for log in job.location_logs.all()[:15]:
            logs.append(
                ShipmentTrackingLocationLogType(
                    lat=float(log.latitude),
                    lng=float(log.longitude),
                    speed_kph=float(log.speed_kph or 65.0),
                    timestamp=log.timestamp.isoformat()
                )
            )

        if not logs:
            logs = [
                ShipmentTrackingLocationLogType(lat=p_lat, lng=p_lng, speed_kph=60.0, timestamp="2026-07-10T08:00:00Z"),
                ShipmentTrackingLocationLogType(lat=c_lat, lng=c_lng, speed_kph=65.0, timestamp="2026-07-10T12:00:00Z")
            ]

        # Fetch real road route using OSRM
        route_coords = _fetch_osrm_route(p_lat, p_lng, d_lat, d_lng)
        route_logs = [
            ShipmentTrackingLocationLogType(
                lat=c["lat"],
                lng=c["lng"],
                speed_kph=60.0,
                timestamp=""
            ) for c in route_coords
        ]

        return ShipmentTrackingType(
            id=str(job.id),
            tracking_number=f"TRX-{str(job.id)[:8].upper()}",
            status=job.status,
            pickup=pickup_name,
            delivery=delivery_name,
            estimated_delivery=str(job.deadline) if job.deadline else "2026-07-11",
            current_lat=c_lat,
            current_lng=c_lng,
            current_location=c_loc,
            driver=driver_data,
            milestones=milestones,
            location_logs=logs,
            route_coordinates=route_logs
        )

    @strawberry.field
    def get_route_coordinates(
        self, 
        info: Info, 
        pickup_lat: float, 
        pickup_lng: float, 
        delivery_lat: float, 
        delivery_lng: float
    ) -> List[ShipmentTrackingLocationLogType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        route_coords = _fetch_osrm_route(pickup_lat, pickup_lng, delivery_lat, delivery_lng)
        return [
            ShipmentTrackingLocationLogType(
                lat=c["lat"],
                lng=c["lng"],
                speed_kph=0.0,
                timestamp=""
            ) for c in route_coords
        ]
