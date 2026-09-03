import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Site, GeoTaskLiveLocation } from '../types/geoTask';
import { Building2, Crosshair, Globe2, Satellite, Users, MapPin, Radio, Plus, X } from 'lucide-react';

interface AdminFleetMapProps {
  sites: Site[];
  liveLocations: GeoTaskLiveLocation[];
  users?: any[];
  onMapClickAddSite?: (coords: { latitude: number; longitude: number }) => void;
  onSelectSite?: (site: Site) => void;
}

export const AdminFleetMap: React.FC<AdminFleetMapProps> = ({
  sites,
  liveLocations,
  users,
  onMapClickAddSite,
  onSelectSite
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const siteLayersRef = useRef<L.LayerGroup | null>(null);
  const employeeLayersRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'STREET' | 'SATELLITE'>('STREET');
  const [isAddMode, setIsAddMode] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = sites.length > 0
        ? [sites[0].latitude, sites[0].longitude]
        : [28.6139, 77.2090]; // Delhi HQ

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      siteLayersRef.current = L.layerGroup().addTo(map);
      employeeLayersRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Handle map click for adding site
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (onMapClickAddSite) {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        onMapClickAddSite({ latitude: lat, longitude: lng });
        setIsAddMode(false);
      }
    };

    if (isAddMode) {
      map.on('click', handleMapClick);
    } else {
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isAddMode, onMapClickAddSite]);

  // Switch Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (mapType === 'SATELLITE') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 19
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CARTO & OpenStreetMap',
          maxZoom: 19
        }
      ).addTo(map);
    }

    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [mapType]);

  // Update Sites and Geofences
  useEffect(() => {
    if (!mapInstanceRef.current || !siteLayersRef.current) return;

    siteLayersRef.current.clearLayers();

    sites.forEach((site) => {
      // Geofence perimeter circle
      const circle = L.circle([site.latitude, site.longitude], {
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 5',
        radius: site.radiusMeters
      });

      circle.bindTooltip(
        `<div class="text-xs font-bold text-white">${site.name}</div><div class="text-[10px] text-indigo-300">Geofence Radius: ${site.radiusMeters}m</div>`,
        { permanent: true, direction: 'top', className: 'geofence-tooltip' }
      );

      // Facility marker
      const siteIcon = L.divIcon({
        className: 'site-admin-pin',
        html: `
          <div class="w-8 h-8 rounded-xl bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: siteIcon });
      marker.bindPopup(`
        <div class="p-1 space-y-1">
          <div class="font-bold text-xs text-white">${site.name}</div>
          <div class="text-[11px] text-slate-300">Facility ID: <span class="font-mono text-indigo-300">${site._id}</span></div>
          <div class="text-[11px] text-slate-300">Geofence Perimeter: <span class="font-bold text-emerald-400">${site.radiusMeters} meters</span></div>
          <div class="text-[10px] text-slate-400 font-mono pt-1">Coordinates: ${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}</div>
        </div>
      `);

      siteLayersRef.current?.addLayer(circle);
      siteLayersRef.current?.addLayer(marker);
    });
  }, [sites]);

  // Update Live Employee Positions
  useEffect(() => {
    if (!mapInstanceRef.current || !employeeLayersRef.current) return;

    employeeLayersRef.current.clearLayers();

    liveLocations.forEach((loc) => {
      const empIcon = L.divIcon({
        className: 'emp-live-marker',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9">
            <div class="absolute w-9 h-9 rounded-full bg-emerald-500/40 animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center font-black text-[9px] text-white">
              ${loc.userName ? loc.userName.charAt(0) : 'U'}
            </div>
            <div class="absolute -bottom-4 px-1.5 py-0.5 rounded bg-slate-950/95 border border-slate-800 text-[9px] font-bold text-emerald-400 whitespace-nowrap shadow-md">
              ${loc.userName || 'Employee'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: empIcon });
      marker.bindPopup(`
        <div class="p-1 space-y-1">
          <div class="font-bold text-xs text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ${loc.userName}
          </div>
          <div class="text-[11px] text-slate-300">User ID: <span class="font-mono text-indigo-300">${loc.userId}</span></div>
          <div class="text-[11px] text-slate-300">Speed: <span class="font-bold text-white">${Math.round(loc.speed * 3.6)} km/h</span></div>
          <div class="text-[10px] text-slate-400 font-mono">Position: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</div>
          <div class="text-[10px] text-slate-500 pt-0.5">Last beacon: ${new Date(Number(loc.timestamp) || Date.now()).toLocaleTimeString()}</div>
        </div>
      `);

      employeeLayersRef.current?.addLayer(marker);
    });
  }, [liveLocations]);

  const handleZoomToSite = (site: Site) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([site.latitude, site.longitude], 17, { animate: true });
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;

    const points: [number, number][] = [];
    sites.forEach((s) => points.push([s.latitude, s.longitude]));
    liveLocations.forEach((l) => points.push([l.latitude, l.longitude]));

    if (points.length === 0) return;
    if (points.length === 1) {
      mapInstanceRef.current.setView(points[0], 16, { animate: true });
    } else {
      mapInstanceRef.current.fitBounds(points, { padding: [40, 40] });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Cartography:
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {liveLocations.length} Active Employee{liveLocations.length === 1 ? '' : 's'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            {sites.length} Geofenced Site{sites.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Site Quick Jump & Layer Switcher */}
        <div className="flex items-center gap-1.5">
          {sites.map((site) => (
            <button
              key={site._id}
              onClick={() => handleZoomToSite(site)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              title={`Zoom to ${site.name}`}
            >
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>{site.name.split(' - ')[0]}</span>
            </button>
          ))}

          <button
            onClick={handleFitAll}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            title="Fit all sites and employees in view"
          >
            <Crosshair className="w-3 h-3 text-indigo-400" />
            <span>Fit All</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {onMapClickAddSite && (
            <button
              onClick={() => setIsAddMode(!isAddMode)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
                isAddMode
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Click on the map to add a new geofenced site"
            >
              {isAddMode ? (
                <>
                  <X className="w-3 h-3" />
                  <span>Cancel Map Pick</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Add Site on Map</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setMapType(mapType === 'STREET' ? 'SATELLITE' : 'STREET')}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
          >
            {mapType === 'STREET' ? (
              <>
                <Satellite className="w-3 h-3" />
                <span>Satellite View</span>
              </>
            ) : (
              <>
                <Globe2 className="w-3 h-3" />
                <span>Street View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div className={`relative flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 ${isAddMode ? 'cursor-crosshair' : ''}`}>
        <div ref={mapContainerRef} className={`w-full h-full z-0 ${isAddMode ? 'cursor-crosshair' : ''}`} />

        {/* Add Site Click Mode Floating Banner */}
        {isAddMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-200 pointer-events-none animate-pulse">
            <MapPin className="w-4 h-4 text-slate-950" />
            <span>Click anywhere on the map to set coordinates and add a site!</span>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[11px] space-y-1.5 shadow-xl pointer-events-none">
          <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Cartography Legend</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 border border-white"></span>
            <span>Facility Center (HQ / Hub)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-indigo-400 bg-indigo-500/20"></span>
            <span>Geofence Boundary (100m–150m)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Active Employee Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
