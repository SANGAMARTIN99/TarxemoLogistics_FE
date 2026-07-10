import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gsap } from 'gsap';
import {
  MapPin, Navigation, Truck, CheckCircle2, Clock, Circle,
  Map, List, Search, ArrowLeft, AlertTriangle, Phone, Star
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { GET_CUSTOMER_SHIPMENTS, GET_SHIPMENT_TRACKING } from '../../api/queries';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = L.divIcon({
  html: `<div style="background:#E8580A;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(232,88,10,0.5)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const checkpointIcon = (passed: boolean) => L.divIcon({
  html: `<div style="background:${passed ? '#10b981' : '#6b7280'};width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});



function MapCenterFly({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 7, { duration: 1.5 }); }, [lat, lng]);
  return null;
}

const CustomerTracking: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { theme } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'map' | 'progress'>('map');
  const [searchTrk, setSearchTrk] = useState('');

  const [activeId, setActiveId] = useState<string | null>(id || null);

  useEffect(() => {
    if (id) {
      setActiveId(id);
    }
  }, [id]);

  const { data: shipmentsData } = useQuery(GET_CUSTOMER_SHIPMENTS, {
    skip: !!activeId,
    variables: { pageSize: 1 },
  });

  useEffect(() => {
    if (!activeId && shipmentsData?.customerShipments?.items?.length > 0) {
      setActiveId(shipmentsData.customerShipments.items[0].id);
    }
  }, [shipmentsData, activeId]);

  const { data: trackingData, loading } = useQuery(GET_SHIPMENT_TRACKING, {
    skip: !activeId,
    variables: { shipmentId: activeId || "" },
    pollInterval: 10000,
  });

  const tracking = trackingData?.shipmentTracking || null;
  const milestones = tracking?.milestones || [];

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  if (loading && !tracking) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-muted)] text-xs">Locating cargo GPS signals...</p>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="glass border border-[var(--color-border)] rounded-2xl p-12 text-center max-w-md mx-auto">
        <AlertTriangle className="text-orange-500 mx-auto mb-4" size={40} />
        <h3 className="font-bold text-[var(--color-text)]">No Active Shipment Tracking</h3>
        <p className="text-[var(--color-text-muted)] text-xs mt-2">
          We could not find any active shipment assigned to this account or matching the identifier.
        </p>
        <button onClick={() => navigate('/dashboard/shipments')} className="mt-6 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors">
          Go to Shipments
        </button>
      </div>
    );
  }

  const passedCount = milestones.filter((m: any) => m.status === 'PASSED').length;
  const progress = milestones.length > 1 ? Math.round((passedCount / (milestones.length - 1)) * 100) : 0;
  const routeCoords: [number, number][] = milestones.map((m: any) => [m.lat, m.lng]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/shipments')}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-orange-500/30 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--color-text)] flex items-center gap-2">
              <Navigation size={20} className="text-orange-500" />
              Live Cargo Tracking
            </h1>
            <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
              Tracking: <span className="font-mono text-orange-400 font-bold">{tracking.trackingNumber}</span>
            </p>
          </div>
        </div>
        {/* View Toggle */}
        <div className="flex p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] gap-1">
          {[{ key: 'map', icon: Map, label: 'Map View' }, { key: 'progress', icon: List, label: 'Progress' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key as 'map' | 'progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === v.key ? 'bg-orange-500 text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
              <v.icon size={13} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Route Progress</p>
            <p className="text-sm font-black text-[var(--color-text)] mt-0.5">{tracking.pickup} → {tracking.delivery}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-orange-500">{progress}%</p>
            <p className="text-[9px] text-[var(--color-text-muted)]">{passedCount} of {milestones.length} stops</p>
          </div>
        </div>
        <div className="w-full h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-[9px] text-[var(--color-text-muted)]">{tracking.pickup}</p>
          <p className="text-[9px] text-[var(--color-text-muted)]">ETA: {tracking.estimatedDelivery}</p>
          <p className="text-[9px] text-[var(--color-text-muted)]">{tracking.delivery}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {view === 'map' ? (
            <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden" style={{ height: '500px' }}>
              <MapContainer
                center={[tracking.currentLat, tracking.currentLng]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterFly lat={tracking.currentLat} lng={tracking.currentLng} />
                {/* Route polyline */}
                <Polyline positions={routeCoords} color="#E8580A" weight={3} dashArray="8 4" opacity={0.7} />
                {/* Milestones */}
                {milestones.map((m: any) => (
                  <Marker key={m.id} position={[m.lat, m.lng]}
                    icon={m.status === 'CURRENT' ? truckIcon : checkpointIcon(m.status === 'PASSED')}>
                    <Popup>
                      <div className="text-xs p-1">
                        <p className="font-bold text-gray-800">{m.location}</p>
                        <p className="text-gray-500 mt-1">{m.description}</p>
                        {m.actualTime && <p className="text-green-600 mt-1">✓ Passed: {m.actualTime}</p>}
                        {!m.actualTime && <p className="text-gray-400 mt-1">ETA: {m.estimatedTime}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            /* PROGRESS VIEW */
            <div className="glass border border-[var(--color-border)] rounded-2xl p-6">
              <h3 className="font-bold text-sm text-[var(--color-text)] mb-6 flex items-center gap-2">
                <List size={16} className="text-orange-500" />
                Corridor Milestone Tracker
              </h3>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[var(--color-border)]" />
                <div className="absolute left-5 top-6 w-0.5 bg-gradient-to-b from-orange-500 to-orange-400 transition-all duration-1000"
                  style={{ height: `${progress}%` }} />

                <div className="space-y-0">
                  {milestones.map((milestone: any, idx: number) => {
                    const isPassed = milestone.status === 'PASSED';
                    const isCurrent = milestone.status === 'CURRENT';
                    const isPending = milestone.status === 'PENDING';
                    return (
                      <div key={milestone.id} className="flex gap-5 pb-8 relative">
                        {/* Icon */}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isPassed ? 'bg-emerald-500 border-emerald-400' :
                          isCurrent ? 'bg-orange-500 border-orange-400 animate-pulse' :
                          'bg-[var(--color-surface-2)] border-[var(--color-border)]'
                        }`}>
                          {isPassed ? <CheckCircle2 size={18} className="text-white" /> :
                           isCurrent ? <Truck size={18} className="text-white" /> :
                           <Circle size={18} className="text-[var(--color-text-muted)]" />}
                        </div>
                        {/* Content */}
                        <div className={`flex-1 rounded-xl p-4 border transition-all ${
                          isPassed ? 'bg-emerald-500/5 border-emerald-500/20' :
                          isCurrent ? 'bg-orange-500/10 border-orange-500/30' :
                          'bg-[var(--color-surface-2)]/30 border-[var(--color-border)]'
                        }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-sm ${isCurrent ? 'text-orange-400' : isPassed ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'}`}>
                                  {milestone.location}
                                </p>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[8px] font-black uppercase animate-pulse">LIVE</span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{milestone.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {isPassed && milestone.actualTime && (
                                <p className="text-[9px] text-emerald-400 font-bold">✓ {milestone.actualTime}</p>
                              )}
                              {(isCurrent || isPending) && (
                                <p className="text-[9px] text-[var(--color-text-muted)]">ETA: {milestone.estimatedTime}</p>
                              )}
                            </div>
                          </div>
                          {/* Distance indicator */}
                          {idx < milestones.length - 1 && (
                            <p className="text-[9px] text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
                              <Navigation size={9} />
                              Next: {milestones[idx + 1].location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Driver & Shipment Info Panel */}
        <div className="space-y-4">
          {/* Driver Card */}
          <div className="glass border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Assigned Driver</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg">
                {tracking.driver.firstName[0]}
              </div>
              <div>
                <p className="font-bold text-[var(--color-text)]">{tracking.driver.firstName} {tracking.driver.lastName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={10} className={s <= Math.floor(tracking.driver.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-text-muted)]'} />
                  ))}
                  <span className="text-[10px] text-[var(--color-text-muted)] ml-1">{tracking.driver.rating}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Vehicle</span>
                <span className="font-bold font-mono text-[var(--color-text)]">{tracking.driver.vehiclePlate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Phone</span>
                <span className="font-bold text-[var(--color-text)]">{tracking.driver.phone}</span>
              </div>
            </div>
            <a href={`tel:${tracking.driver.phone}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
              <Phone size={13} />
              Call Driver
            </a>
          </div>

          {/* Current Location Card */}
          <div className="glass border border-orange-500/20 rounded-2xl p-5 bg-orange-500/5">
            <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin size={12} />
              Current Location
            </h3>
            <p className="text-[var(--color-text)] font-bold text-sm">{tracking.currentLocation}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              {tracking.currentLat.toFixed(4)}°N, {tracking.currentLng.toFixed(4)}°E
            </p>
            <p className="text-[10px] text-orange-400 mt-2 font-bold">● Broadcasting GPS Live</p>
          </div>

          {/* Shipment Info */}
          <div className="glass border border-[var(--color-border)] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Shipment Details</h3>
            {[
              { label: 'Status', value: 'In Transit' },
              { label: 'Est. Delivery', value: tracking.estimatedDelivery },
              { label: 'Stops Remaining', value: `${milestones.filter((m: any) => m.status === 'PENDING').length} of ${milestones.length}` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">{item.label}</span>
                <span className="font-bold text-[var(--color-text)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
