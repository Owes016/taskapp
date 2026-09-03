import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Crosshair,
  Building2,
  X,
  Satellite,
  Globe2,
  Sparkles,
  Navigation,
  Check,
  RotateCcw,
  Sliders,
  Compass
} from 'lucide-react';
import { Site } from '../types/geoTask';
import { geoTaskApi } from '../services/geoTaskApi';

interface SiteLocationPickerModalProps {
  isOpen: boolean;
  editingSite: Site | null;
  initialLocation?: { latitude: number; longitude: number };
  onClose: () => void;
  onSave: (siteData: { name: string; latitude: number; longitude: number; radiusMeters: number }) => Promise<void>;
}

// Popular high-traffic distribution, tech and logistics presets
const QUICK_PRESETS = [
  { name: 'HQ Operations - New Delhi', lat: 28.6139, lon: 77.2090, tag: 'HQ' },
  { name: 'Central Logistics - Mumbai', lat: 19.0760, lon: 72.8777, tag: 'Port' },
  { name: 'Tech Park Campus - Bengaluru', lat: 12.9716, lon: 77.5946, tag: 'Tech' },
  { name: 'HITEC Hub - Hyderabad', lat: 17.4474, lon: 78.3762, tag: 'Logistics' },
  { name: 'Times Square - New York', lat: 40.7580, lon: -73.9855, tag: 'US East' },
  { name: 'Central Depot - London', lat: 51.5074, lon: -0.1278, tag: 'UK Hub' },
  { name: 'Downtown Hub - Dubai', lat: 25.2048, lon: 55.2708, tag: 'UAE' },
  { name: 'Changi Air Freight - Singapore', lat: 1.3644, lon: 103.9915, tag: 'APAC' }
];

export const SiteLocationPickerModal: React.FC<SiteLocationPickerModalProps> = ({
  isOpen,
  editingSite,
  initialLocation,
  onClose,
  onSave
}) => {
  // Form values
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [radiusMeters, setRadiusMeters] = useState(100);

  // Search & Geocoding
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; display_name: string; latitude: number; longitude: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'STREET' | 'SATELLITE'>('STREET');
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (editingSite) {
        setName(editingSite.name);
        setLatitude(editingSite.latitude);
        setLongitude(editingSite.longitude);
        setRadiusMeters(editingSite.radiusMeters || 100);
      } else if (initialLocation) {
        setName('');
        setLatitude(initialLocation.latitude);
        setLongitude(initialLocation.longitude);
        setRadiusMeters(100);
      } else {
        setName('');
        setLatitude(28.6139);
        setLongitude(77.2090);
        setRadiusMeters(100);
      }
      setSearchQuery('');
      setSearchResults([]);
      setErrorMessage(null);
    }
  }, [isOpen, editingSite, initialLocation]);

  // Leaflet Map Initialization & Tile Switching
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle map click to reposition pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        setLatitude(newLat);
        setLongitude(newLng);

        // Reverse geocode if name is currently empty
        geoTaskApi.reverseGeocode(newLat, newLng).then((res) => {
          if (res && (!name || name.startsWith('Site ('))) {
            setName(res.name);
          }
        });
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Switch Tile Layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (mapType === 'SATELLITE') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);
    }

    // Invalidate size to ensure full render
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(t);
  }, [isOpen, mapType]);

  // Update Marker & Geofence Circle when coordinates or radius change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || isNaN(latitude) || isNaN(longitude)) return;

    const latLng: [number, number] = [latitude, longitude];

    // Custom pulse marker
    const pinIcon = L.divIcon({
      className: 'site-picker-pin',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2">
          <div class="absolute w-10 h-10 rounded-full bg-indigo-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-2xl bg-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-white cursor-grab">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Update or create marker
    if (!markerRef.current) {
      const marker = L.marker(latLng, {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        const newLat = parseFloat(pos.lat.toFixed(6));
        const newLng = parseFloat(pos.lng.toFixed(6));
        setLatitude(newLat);
        setLongitude(newLng);

        geoTaskApi.reverseGeocode(newLat, newLng).then((res) => {
          if (res && (!name || name.startsWith('Site ('))) {
            setName(res.name);
          }
        });
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(latLng);
    }

    // Update or create geofence circle
    if (!circleRef.current) {
      const circle = L.circle(latLng, {
        radius: radiusMeters,
        color: '#6366f1',
        weight: 2,
        fillColor: '#6366f1',
        fillOpacity: 0.18,
        dashArray: '4, 4'
      }).addTo(map);

      circleRef.current = circle;
    } else {
      circleRef.current.setLatLng(latLng);
      circleRef.current.setRadius(radiusMeters);
    }
  }, [latitude, longitude, radiusMeters]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    }
  }, [isOpen]);

  // Fly to location helper
  const flyToLocation = (lat: number, lng: number, zoom = 16) => {
    setLatitude(lat);
    setLongitude(lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  // Perform geocode search
  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await geoTaskApi.geocode(queryText);
      setSearchResults(results || []);
    } catch (err) {
      console.warn('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(text);
      }, 350);
    } else {
      setSearchResults([]);
    }
  };

  // Select search result
  const handleSelectSearchResult = (result: { name: string; display_name: string; latitude: number; longitude: number }) => {
    flyToLocation(result.latitude, result.longitude);
    if (!name || name.trim() === '') {
      setName(result.name);
    }
    setSearchQuery(result.name);
    setSearchResults([]);
    setSearchFocused(false);
  };

  // Detect Current GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = parseFloat(pos.coords.latitude.toFixed(6));
        const curLng = parseFloat(pos.coords.longitude.toFixed(6));
        flyToLocation(curLat, curLng, 17);

        try {
          const rev = await geoTaskApi.reverseGeocode(curLat, curLng);
          if (rev && (!name || name.trim() === '')) {
            setName(rev.name);
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        }
        setIsLocatingUser(false);
      },
      (err) => {
        setIsLocatingUser(false);
        alert(`Could not acquire GPS position: ${err.message}. Please click directly on the map to set location.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a site or facility name.');
      return;
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      setErrorMessage('Please select a valid location on the map or enter coordinates.');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setErrorMessage('Latitude must be between -90 and 90, and longitude between -180 and 180.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        radiusMeters: Math.max(10, radiusMeters)
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save site');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {editingSite ? 'Edit Geofenced Site' : 'Add New Geofenced Site'}
              </h3>
              <p className="text-xs text-slate-400">
                Place pin by searching name or clicking anywhere on the interactive map
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Map & Controls */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Column: Form & Geocoding (5 cols on lg) */}
          <div className="lg:col-span-5 p-4 sm:p-5 overflow-y-auto space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            )}

            {/* 1. Site Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Site / Facility Name *</span>
                <span className="text-[11px] text-slate-400 font-normal">e.g. North Terminal</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter facility name (e.g. Northern Hub)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* 2. Search by Place / Landmark / Address */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Search by Place Name or Address</span>
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">OSM / Presets</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchQuery);
                    }
                  }}
                  placeholder="Type city, landmark, or street name..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white pl-9 pr-20 py-2.5 rounded-xl text-xs focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />

                <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSearch(searchQuery)}
                    disabled={isSearching}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    {isSearching ? <span className="animate-spin text-xs">⏳</span> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="p-1.5 space-y-1">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs flex items-start gap-2 text-slate-200 cursor-pointer transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-white truncate">{res.name}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{res.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Quick Actions: GPS & Popular Hubs */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Quick Presets & GPS</span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingUser}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                  <span>{isLocatingUser ? 'Detecting GPS...' : 'Use My Current Location'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      flyToLocation(preset.lat, preset.lon);
                      if (!name || name.trim() === '') {
                        setName(preset.name);
                      }
                      setSearchQuery(preset.name);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-600 text-slate-300 hover:text-indigo-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{preset.name.split('-')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Geofence Radius Control */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Geofence Allowed Radius</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold text-xs">
                  {radiusMeters} meters
                </span>
              </div>

              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
              />

              <div className="flex items-center gap-1.5">
                {[50, 100, 250, 500].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusMeters(r)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      radiusMeters === r
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Workers can only check in and begin tasks when physically within this GPS circle.
              </p>
            </div>

            {/* 5. Precision Coordinates (Lat/Lng) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">Pin Coordinates (WGS84)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) flyToLocation(val, longitude);
                      else setLatitude(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) flyToLocation(latitude, val);
                      else setLongitude(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Leaflet Map (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col relative h-[360px] lg:h-auto min-h-[340px] bg-slate-950">
            {/* Map Top Bar Instruction Banner */}
            <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-none flex flex-wrap items-center justify-between gap-2">
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-indigo-500/50 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-white">Click anywhere on map to reposition pin</span>
              </div>

              {/* Map Type Toggle */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-slate-800 p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMapType('STREET')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    mapType === 'STREET' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe2 className="w-3 h-3" />
                  <span>Street</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('SATELLITE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    mapType === 'SATELLITE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Satellite className="w-3 h-3" />
                  <span>Satellite</span>
                </button>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="flex-1 w-full h-full cursor-crosshair" />

            {/* Bottom Map Info Footer */}
            <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 z-10">
              <div className="flex items-center gap-2 font-mono">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => flyToLocation(latitude, longitude)}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Center on Pin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 hidden sm:block">
            {name.trim() ? (
              <span>Configuring perimeter for <strong className="text-white">{name}</strong> ({radiusMeters}m radius)</span>
            ) : (
              <span>Enter a site name to proceed</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : editingSite ? 'Update Site' : 'Create Geofenced Site'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
