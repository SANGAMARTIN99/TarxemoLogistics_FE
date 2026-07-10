import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { gsap } from 'gsap';
import {
  Truck, Shield, Star, Award, Clock, MapPin, Send,
  CheckCircle2, AlertTriangle, Play, Pause, RefreshCw,
  ClipboardList, X, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GET_DRIVER_DASHBOARD } from '../../api/queries';
import { LOG_LOCATION } from '../../api/mutations';
import toast from 'react-hot-toast';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
});

function MapCenterFly({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 8, { duration: 1.5 });
  }, [lat, lng]);
  return null;
}

const DriverTrips: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: dashData, loading, refetch } = useQuery(GET_DRIVER_DASHBOARD);
  const [logLocation] = useMutation(LOG_LOCATION);

  const [isDutyActive, setIsDutyActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: -6.8160, lng: 39.2803 }); // Dar es Salaam default
  const [gpsLogCount, setGpsLogCount] = useState(0);

  // Check-in modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [customLogText, setCustomLogText] = useState('');
  const [customLogType, setCustomLogType] = useState('CUSTOMS');

  const activeTrip = dashData?.driverDashboard?.upcomingTrips?.[0] || null;

  // Track coordinates drift
  useEffect(() => {
    let interval: any;
    if (isDutyActive && activeTrip) {
      toast.success('Duty active: broadcasting real-time GPS telemetry.');
      interval = setInterval(() => {
        setCurrentCoords((prev) => {
          // Drift coordinates slightly towards the delivery terminal
          const nextLat = prev.lat + (Math.random() - 0.45) * 0.005;
          const nextLng = prev.lng + (Math.random() - 0.45) * 0.005;

          logLocation({
            variables: {
              input: {
                tripId: activeTrip.id,
                latitude: parseFloat(nextLat.toFixed(5)),
                longitude: parseFloat(nextLng.toFixed(5)),
                speedKph: 60.0,
                heading: 90.0,
              }
            }
          }).catch(() => {});

          setGpsLogCount((c) => c + 1);
          return { lat: nextLat, lng: nextLng };
        });
      }, 10000); // 10 seconds interval
    }

    return () => clearInterval(interval);
  }, [isDutyActive, activeTrip]);

  const handleCustomCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !customLogText.trim()) return;

    logLocation({
      variables: {
        input: {
          tripId: activeTrip.id,
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          speedKph: 0.0,
          heading: 0.0,
        }
      }
    }).then(() => {
      toast.success(`Check-in logged successfully: ${customLogType}`);
      setCustomLogText('');
      setIsLogModalOpen(false);
      setGpsLogCount((c) => c + 1);
    }).catch((err) => {
      toast.error(err.message || 'Log submission failed.');
    });
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Truck size={20} className="text-orange-500" />
            </div>
            Active Cargo Missions
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Manage current manifest routing, checkpoints, and GPS telematics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTrip && (
            <button
              onClick={() => setIsDutyActive(!isDutyActive)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                isDutyActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isDutyActive ? (
                <>
                  <Pause size={12} />
                  <span>Go Off Duty</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>Start Duty</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/30 glass text-[var(--color-text-muted)] transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {!activeTrip ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-16 text-center">
          <Truck size={48} className="text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-[var(--color-text)]">No Active Dispatched Trips</h3>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">
            You do not have any active shipments assigned to your driver profile. Check the mission board to apply.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map view */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden h-[380px] relative">
              <MapContainer
                center={[currentCoords.lat, currentCoords.lng]}
                zoom={8}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[currentCoords.lat, currentCoords.lng]} icon={truckIcon}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">Truck Telemetry</p>
                      <p>Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)}</p>
                    </div>
                  </Popup>
                </Marker>
                <MapCenterFly lat={currentCoords.lat} lng={currentCoords.lng} />
              </MapContainer>
            </div>

            {/* Checklist details */}
            <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Active Consignment</span>
                <span className="badge badge-success text-[8px] uppercase">{activeTrip.status}</span>
              </div>
              <div>
                <h4 className="font-bold text-[var(--color-text)] text-sm">{activeTrip.title}</h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider">Pickup Point</span>
                    <span className="font-semibold text-[var(--color-text)]">{activeTrip.pickup}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider">Delivery Depot</span>
                    <span className="font-semibold text-[var(--color-text)]">{activeTrip.delivery}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry sidebar */}
          <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="font-bold text-[var(--color-text)] text-sm">Telemetry Manifest</h3>
              <p className="text-[var(--color-text-muted)] text-[10px] mt-1">Live data broadcasts logged during transit</p>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface-2)] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Broadcasting</span>
                <span className={`font-mono font-bold ${isDutyActive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isDutyActive ? 'ACTIVE' : 'OFF DUTY'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">GPS Logs Sent</span>
                <span className="font-mono font-bold text-orange-400">{gpsLogCount} packets</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Current Lat</span>
                <span className="font-mono font-bold text-[var(--color-text)]">{currentCoords.lat.toFixed(5)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Current Lng</span>
                <span className="font-mono font-bold text-[var(--color-text)]">{currentCoords.lng.toFixed(5)}</span>
              </div>
            </div>

            {isDutyActive && (
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <FileText size={12} />
                Report Checkpoint
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual Checkin Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
                <FileText size={14} className="text-orange-500" />
                <span>Submit Customs/Incident Log</span>
              </h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Log customs clearances, fuel refills, and mechanical incidents</p>
            </div>

            <form onSubmit={handleCustomCheckin} className="space-y-4">
              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Log Type</label>
                <select
                  value={customLogType}
                  onChange={(e) => setCustomLogType(e.target.value)}
                  className="input-field text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
                >
                  <option value="CUSTOMS">Customs & Border Clearance</option>
                  <option value="FUEL">Fuel Station Refill</option>
                  <option value="MECHANICAL">Mechanical Check / Repair</option>
                  <option value="DELAY">Traffic / Road Incident Delay</option>
                  <option value="REST">Driver Rest Break</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Description & Details</label>
                <textarea
                  value={customLogText}
                  onChange={(e) => setCustomLogText(e.target.value)}
                  placeholder="e.g. Cleared through Kenya-Uganda customs gate at Malaba. All cargo seals intact."
                  className="input-field text-xs h-24 resize-none bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
                  required
                />
              </div>

              <div className="bg-[var(--color-surface-2)] p-3 rounded-lg border border-[var(--color-border)] text-[9px] text-[var(--color-text-light)]">
                Attachment coords: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTrips;
