import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Site } from '../types/geoTask';
import {
  Building2,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  Layers,
  Crosshair,
  Globe2,
  Satellite
} from 'lucide-react';
import { formatDistance } from '../utils/haversine';

interface InteractiveMapTabProps {
  site: Site;
  userCoords: { latitude: number; longitude: number } | null;
  distanceToSite: number | null;
  isInside: boolean;
  onSimulateCoordinates: (lat: number, lng: number) => void;
}

type MapDisplayMode = 'STREET' | 'SATELLITE' | 'RADAR';

export const InteractiveMapTab: React.FC<InteractiveMapTabProps> = ({
  site,
  userCoords,
  distanceToSite,
  isInside,
  onSimulateCoordinates
}) => {
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('STREET');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const siteMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize and update Leaflet Tile Map
  useEffect(() => {
    if (displayMode === 'RADAR' || !mapContainerRef.current) return;

    const initialLat = userCoords?.latitude || site.latitude;
    const initialLng = userCoords?.longitude || site.longitude;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Click to reposition GPS
      map.on('click', (e: L.LeafletMouseEvent) => {
        onSimulateCoordinates(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Switch Tile Layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (displayMode === 'SATELLITE') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 19
        }
      ).addTo(map);
    } else {
      // CartoDB Voyager Street Tiles
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CARTO & OpenStreetMap',
          maxZoom: 19
        }
      ).addTo(map);
    }

    // Render Geofence Circle
    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.remove();
    }

    const circleColor = isInside ? '#10b981' : '#6366f1';
    const circle = L.circle([site.latitude, site.longitude], {
      color: circleColor,
      fillColor: circleColor,
      fillOpacity: isInside ? 0.2 : 0.12,
      weight: 2.5,
      dashArray: '6, 6',
      radius: site.radiusMeters
    }).addTo(map);

    circle.bindTooltip(
      `<div class="text-xs font-bold text-slate-100">${site.name}</div><div class="text-[10px] text-slate-300">Geofence: ${site.radiusMeters}m</div>`,
      { permanent: true, direction: 'top', className: 'geofence-tooltip' }
    );
    geofenceCircleRef.current = circle;

    // Render Site Marker (HQ / Warehouse)
    if (siteMarkerRef.current) {
      siteMarkerRef.current.remove();
    }

    const siteIcon = L.divIcon({
      className: 'site-facility-icon',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="w-8 h-8 rounded-xl bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    siteMarkerRef.current = L.marker([site.latitude, site.longitude], {
      icon: siteIcon,
      interactive: false
    }).addTo(map);

    // Render Draggable User Live GPS Marker
    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-live-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-grab active:cursor-grabbing">
            <div class="absolute w-10 h-10 rounded-full ${isInside ? 'bg-emerald-500/35' : 'bg-rose-500/35'} animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full ${isInside ? 'bg-emerald-500' : 'bg-rose-500'} border-2 border-white shadow-2xl flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[9px] font-extrabold ${
              isInside ? 'text-emerald-400' : 'text-rose-400'
            } whitespace-nowrap shadow-lg">
              ${isInside ? 'YOU (INSIDE)' : 'YOU (BLOCKED)'}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.latitude, userCoords.longitude]);
        userMarkerRef.current.setIcon(userIcon);
      } else {
        const marker = L.marker([userCoords.latitude, userCoords.longitude], {
          icon: userIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const newPos = (e.target as L.Marker).getLatLng();
          onSimulateCoordinates(Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6)));
        });

        userMarkerRef.current = marker;
      }
    }

    // Invalidate map size to ensure full rendering inside flex container
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [displayMode, site, userCoords?.latitude, userCoords?.longitude, isInside]);

  // Clean up Leaflet on unmount or mode switch to radar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current && displayMode === 'RADAR') {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [displayMode]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const targetLat = userCoords?.latitude || site.latitude;
    const targetLng = userCoords?.longitude || site.longitude;
    mapInstanceRef.current.setView([targetLat, targetLng], 17, { animate: true });
  };

  // SVG Radar Calculations for Fallback / Radar View
  const centerCanvas = 200;
  const pixelsPerMeter = 1.0;
  const siteRadiusPx = site.radiusMeters * pixelsPerMeter;

  let userX = centerCanvas;
  let userY = centerCanvas;

  if (userCoords) {
    const latMeters = (userCoords.latitude - site.latitude) * 111000;
    const lonMeters =
      (userCoords.longitude - site.longitude) *
      111000 *
      Math.cos((site.latitude * Math.PI) / 180);

    userX = centerCanvas + lonMeters * pixelsPerMeter;
    userY = centerCanvas - latMeters * pixelsPerMeter;
    userX = Math.max(30, Math.min(370, userX));
    userY = Math.max(30, Math.min(370, userY));
  }

  const handleRadarClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 400;
    const clickY = ((e.clientY - rect.top) / rect.height) * 400;

    const lonMeters = (clickX - centerCanvas) / pixelsPerMeter;
    const latMeters = -(clickY - centerCanvas) / pixelsPerMeter;

    const newLat = site.latitude + latMeters / 111000;
    const newLon =
      site.longitude + lonMeters / (111000 * Math.cos((site.latitude * Math.PI) / 180));

    onSimulateCoordinates(Number(newLat.toFixed(6)), Number(newLon.toFixed(6)));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-16">
      {/* 1. Top Header Banner */}
      <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Geofence Cartography
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
              isInside
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isInside ? (
              <>
                <ShieldCheck className="w-3 h-3" /> Inside Perimeter
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" /> Outside Geofence
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              {site.name}
            </h2>
            <p className="text-[11px] text-slate-400">
              Perimeter: <strong className="text-slate-200">{site.radiusMeters}m</strong> • Distance:{' '}
              <strong className={isInside ? 'text-emerald-400' : 'text-rose-400'}>
                {distanceToSite !== null ? formatDistance(distanceToSite) : '--'}
              </strong>
            </p>
          </div>

          {/* Map Layer Switcher Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700/70">
            <button
              onClick={() => setDisplayMode('STREET')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                displayMode === 'STREET'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="OpenStreetMap / CartoDB Street Tiles"
            >
              <Globe2 className="w-3 h-3" />
              <span>Street</span>
            </button>

            <button
              onClick={() => setDisplayMode('SATELLITE')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                displayMode === 'SATELLITE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Esri Satellite Imagery"
            >
              <Satellite className="w-3 h-3" />
              <span>Satellite</span>
            </button>

            <button
              onClick={() => setDisplayMode('RADAR')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                displayMode === 'RADAR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mathematical SVG Polar Radar"
            >
              <Crosshair className="w-3 h-3" />
              <span>Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Map Canvas Container */}
      <div className="p-3 flex-1 flex flex-col items-center">
        {displayMode === 'RADAR' ? (
          /* SVG RADAR CANVAS */
          <div className="relative w-full max-w-[340px] aspect-square rounded-3xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #6366f1 1px, transparent 1px), radial-gradient(circle, #6366f1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
              }}
            />

            <svg
              viewBox="0 0 400 400"
              className="w-full h-full cursor-crosshair relative z-10"
              onClick={handleRadarClick}
            >
              <defs>
                <radialGradient id="tabGeofenceGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </radialGradient>
              </defs>

              {/* Concentric Guide Rings */}
              <circle cx="200" cy="200" r="50" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />
              <circle cx="200" cy="200" r="150" fill="none" stroke="#1e293b" strokeWidth="1" />

              {/* Geofence Perimeter */}
              <circle
                cx="200"
                cy="200"
                r={siteRadiusPx}
                fill="url(#tabGeofenceGlow)"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Center Site Marker */}
              <g transform="translate(200, 200)">
                <circle r="14" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                <circle r="5" fill="#a5b4fc" />
                <text x="0" y="26" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="bold">
                  {site.name}
                </text>
              </g>

              {/* User Live Marker */}
              <g transform={`translate(${userX}, ${userY})`} className="transition-all duration-300">
                <circle
                  r="18"
                  fill={isInside ? '#22c55e' : '#ef4444'}
                  opacity="0.3"
                  className="animate-ping origin-center"
                />
                <circle
                  r="10"
                  fill={isInside ? '#16a34a' : '#dc2626'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle r="3" fill="#ffffff" />
                <text
                  x="0"
                  y="-14"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                  style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}
                >
                  YOU ({isInside ? 'ALLOWED' : 'BLOCKED'})
                </text>
              </g>
            </svg>

            <div className="absolute bottom-2 inset-x-2 text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800">
                💡 Tap anywhere on radar to simulate GPS
              </span>
            </div>
          </div>
        ) : (
          /* REAL LEAFLET STREET / SATELLITE TILE MAP */
          <div className="relative w-full max-w-[340px] h-[340px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* In-Map Floating Toolbar */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
              <span className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] font-semibold text-slate-300 pointer-events-auto backdrop-blur-sm">
                {displayMode === 'SATELLITE' ? '🛰️ Esri Satellite' : '🗺️ OpenStreetMap & CARTO'}
              </span>

              <button
                onClick={handleRecenter}
                className="px-2 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 pointer-events-auto shadow-md backdrop-blur-sm"
                title="Recenter on Facility and User"
              >
                <Crosshair className="w-3 h-3 text-indigo-400" />
                <span>Center</span>
              </button>
            </div>

            {/* Bottom Tip Badge */}
            <div className="absolute bottom-2 inset-x-2 text-center pointer-events-none z-10">
              <span className="text-[10px] text-slate-300 bg-slate-950/90 px-2.5 py-1 rounded-full border border-slate-800 shadow-lg backdrop-blur-sm">
                👆 Tap anywhere or drag marker to reposition GPS
              </span>
            </div>
          </div>
        )}

        {/* 3. Quick Teleport Presets */}
        <div className="w-full max-w-[340px] mt-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
            <span>Instant GPS Test Scenarios:</span>
            <span className="text-[10px] text-indigo-400 font-mono">Haversine Gated</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSimulateCoordinates(site.latitude + 0.0001, site.longitude + 0.0001)}
              className="py-1.5 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all text-center"
            >
              Inside (~12m)
            </button>

            <button
              onClick={() => onSimulateCoordinates(site.latitude + 0.00085, site.longitude + 0.00085)}
              className="py-1.5 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all text-center"
            >
              Border (~95m)
            </button>

            <button
              onClick={() => onSimulateCoordinates(site.latitude + 0.0035, site.longitude + 0.0035)}
              className="py-1.5 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all text-center"
            >
              Outside (~450m)
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-0.5">
            Coordinates: <span className="font-mono text-slate-300">{userCoords?.latitude.toFixed(4)}, {userCoords?.longitude.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
