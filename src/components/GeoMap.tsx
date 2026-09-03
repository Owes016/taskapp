import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Crosshair, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GeoFenceZone } from '../types';

interface GeoMapProps {
  userLocation: { latitude: number; longitude: number; accuracy: number };
  geofences: GeoFenceZone[];
  activeGeofence: GeoFenceZone | null;
  distanceToGeofence: number;
  isInGeofence: boolean;
  onSelectGeofence: (zone: GeoFenceZone) => void;
  onSetCustomLocation: (lat: number, lng: number) => void;
  onRefreshGps: () => void;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  userLocation,
  geofences,
  activeGeofence,
  distanceToGeofence,
  isInGeofence,
  onSelectGeofence,
  onSetCustomLocation,
  onRefreshGps
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const geofenceLayersRef = useRef<Record<string, L.Circle>>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 16,
        zoomControl: false
      });

      // CartoDB Dark Matter / Modern map tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      // Add custom zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Map click handler to simulate GPS movement
      map.on('click', (e: L.LeafletMouseEvent) => {
        onSetCustomLocation(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Render Geofence Circles
    Object.keys(geofenceLayersRef.current).forEach((id) => {
      geofenceLayersRef.current[id]?.remove();
    });
    geofenceLayersRef.current = {};

    geofences.forEach((zone) => {
      const isSelected = activeGeofence?.id === zone.id;
      const circle = L.circle([zone.latitude, zone.longitude], {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: isSelected ? 0.25 : 0.12,
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? undefined : '5, 5',
        radius: zone.radiusMeters
      }).addTo(map);

      // Popup for each zone
      circle.bindTooltip(
        `<div class="text-xs font-bold text-slate-900">${zone.name}</div><div class="text-[10px] text-slate-600">Radius: ${zone.radiusMeters}m</div>`,
        { permanent: true, direction: 'top', className: 'geofence-tooltip' }
      );

      circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectGeofence(zone);
      });

      geofenceLayersRef.current[zone.id] = circle;
    });

    // Custom pulse marker for user location
    const customUserIcon = L.divIcon({
      className: 'user-radar-icon',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full ${isInGeofence ? 'bg-emerald-500/30' : 'bg-rose-500/30'} animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full ${isInGeofence ? 'bg-emerald-500' : 'bg-rose-500'} border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Update or create user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      userMarkerRef.current.setIcon(customUserIcon);
    } else {
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: customUserIcon
      }).addTo(map);
    }

    // Update GPS Accuracy Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      accuracyCircleRef.current.setRadius(userLocation.accuracy);
    } else {
      accuracyCircleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        weight: 1,
        radius: userLocation.accuracy
      }).addTo(map);
    }
  }, [userLocation, geofences, activeGeofence, isInGeofence]);

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.latitude, userLocation.longitude], 17, {
        duration: 0.8
      });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col h-[400px] lg:h-[480px]">
      {/* Map Header / Status Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Geofence Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-xs">
          {isInGeofence ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-400">Inside Zone:</span>
              <span className="text-slate-200 font-medium">{activeGeofence?.name || 'Office Perimeter'}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold text-amber-400">Out of Bounds:</span>
              <span className="text-slate-200">{distanceToGeofence}m to nearest zone</span>
            </>
          )}
        </div>

        {/* GPS Telemetry & Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            id="gps-refresh-btn"
            onClick={onRefreshGps}
            title="Read High-Accuracy Device GPS"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-semibold shadow-lg transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">GPS Lock (±{userLocation.accuracy}m)</span>
          </button>

          <button
            id="recenter-map-btn"
            onClick={handleCenterOnUser}
            title="Recenter Map on Device"
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-slate-600 text-slate-200 shadow-lg hover:text-indigo-400 transition-all"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom Hint Strip */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400">
        <MapPin className="w-3 h-3 text-cyan-400" />
        <span>Click anywhere on the map to test moving inside or outside office geofence perimeters</span>
      </div>
    </div>
  );
};
