import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Navigation, Home, CheckCircle } from "lucide-react";

// Improved Reverse Geocode with better error handling
async function reverseGeocode(lat, lng) {
  try {
    // Randomizing zoom level slightly or using a precise 18 help sometimes
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        // 👈 VERY IMPORTANT: Nominatim requires a specific User-Agent. 
        // Change 'MySolarApp' to your actual project name.
        'User-Agent': 'KinsSolarMVP/1.0 (admin@yourdomain.com)' 
      }
    });

    if (!res.ok) throw new Error("Network response was not ok");

    const data = await res.json();
    
    // Agar API ne koi error message bheja hai
    if (data.error) throw new Error(data.error);

    const a = data.address || {};
    
    // Rohini/Delhi ke liye customized construction
    const parts = [
      a.house_number && a.road ? `${a.house_number}, ${a.road}` : (a.road || a.pedestrian || a.suburb),
      a.neighbourhood || a.suburb || a.city_district,
      a.city || a.town || a.village || "New Delhi", // Fallback for Delhi areas
      a.state,
      a.postcode
    ].filter(Boolean);

    // Agar parts mil gaye hain toh address dikhao
    if (parts.length >= 2) {
      return parts.join(', ');
    }

    // Agar specific parts nahi mile, toh full display_name use karo (lekin use short karke)
    if (data.display_name) {
      return data.display_name.split(',').slice(0, 5).join(', ');
    }

    return "Address not found at this point";
  } catch (err) {
    console.error("Geocoding failed:", err);
    // 👈 FALLBACK: Taaki user ko pata chale ki address fetch nahi hua
    return "Could not fetch address. Please type manually below.";
  }
}

const MapLocationPicker = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [address, setAddress] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const geocodeTimer = useRef(null); // Used for debouncing API calls
  const markerRef = useRef(null);
  const isFlyingRef = useRef(false);

  // ── Load Leaflet CSS/JS ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (window.L) {
      setMapReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.onload = () => setMapReady(true);
    document.body.appendChild(s);
  }, [isOpen]);

  // ── Debounced Geocode Helper ─────────────────────────────
  // This ensures we only call the API once the user stops moving the map
  const scheduleGeocode = useCallback((lat, lng, delay = 800) => {
    // Clear any existing timer so we don't spam the API while dragging
    if (geocodeTimer.current) {
      clearTimeout(geocodeTimer.current);
    }

    setLoadingAddr(true);

    // Set a new timer to fire only after the user stops for 'delay' ms
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
      setLoadingAddr(false);
    }, delay);
  }, []);

  const syncMarkerToCenter = useCallback(() => {
    const map = mapInstance.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const c = map.getCenter();
    marker.setLatLng(c);
  }, []);

  // ── Init Map ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;

    const startLat = initialLocation?.lat ?? 28.6139;
    const startLng = initialLocation?.lng ?? 77.209;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      inertia: true,
      zoomSnap: 0,
    }).setView([startLat, startLng], initialLocation ? 19 : 15);

    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 22,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      html: `
        <div style="position:relative;width:36px;height:48px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.35))">
          <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="18" fill="#171717"/>
            <circle cx="18" cy="18" r="8" fill="white"/>
            <path d="M18 36 L18 47" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
                    width:12px;height:4px;background:rgba(0,0,0,0.2);
                    border-radius:50%;filter:blur(2px)"></div>
      `,
    });

    const marker = L.marker([startLat, startLng], {
      icon,
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);

    markerRef.current = marker;
    mapInstance.current = map;

    map.on("move", syncMarkerToCenter);

    // When the user STOPS moving the map, trigger the debounced geocode
    map.on("moveend", () => {
      syncMarkerToCenter();
      if (isFlyingRef.current) return;
      const c = map.getCenter();
      // Wait 800ms before asking API to ensure they are done moving
      scheduleGeocode(c.lat, c.lng, 800);
    });

    setTimeout(() => {
      map.invalidateSize({ animate: false });
      syncMarkerToCenter();
    }, 350);

    if (initialLocation) {
      setHasLocation(true);
      scheduleGeocode(initialLocation.lat, initialLocation.lng, 500);
    } else {
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          isFlyingRef.current = true;
          map.flyTo([coords.latitude, coords.longitude], 19, { duration: 1.2 });
          setHasLocation(true);
          setTimeout(() => {
            isFlyingRef.current = false;
            syncMarkerToCenter();
            const c = map.getCenter();
            scheduleGeocode(c.lat, c.lng, 500);
          }, 1500);
        },
        () => setHasLocation(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markerRef.current = null;
    };
  }, [isOpen, mapReady, scheduleGeocode, initialLocation]);

  // ── GPS Button ───────────────────────────────────────────
  const handleGPS = useCallback(() => {
    setGpsLoading(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        isFlyingRef.current = true;
        mapInstance.current?.flyTo([coords.latitude, coords.longitude], 19, {
          duration: 1,
        });
        setHasLocation(true);
        setGpsLoading(false);
        setTimeout(() => {
          isFlyingRef.current = false;
          syncMarkerToCenter();
          scheduleGeocode(coords.latitude, coords.longitude, 500);
        }, 1200);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [scheduleGeocode, syncMarkerToCenter]);

  const handleConfirm = useCallback(() => {
    const pos = markerRef.current
      ? markerRef.current.getLatLng()
      : mapInstance.current.getCenter();
    onLocationSelect({ lat: pos.lat, lng: pos.lng, address });
    onClose();
  }, [address, onLocationSelect, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setHasLocation(false);
      setAddress("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center font-[font3]"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ height: "90svh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X size={18} className="text-gray-600" />
          </button>
          <div>
            <h3 className="font-bold text-neutral-900 text-lg tracking-tight font-[font3] leading-tight">
              Place pin on your rooftop
            </h3>
            <p className="text-xs text-gray-500 font-[font3] mt-0.5">
              Move the map so the pin sits exactly on your roof
            </p>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />

          {/* GPS Button */}
          <button
            onClick={handleGPS}
            disabled={gpsLoading}
            className="absolute top-3 right-3 z-[1001] w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
          >
            {gpsLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation size={17} className="text-neutral-800" />
            )}
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-3 left-3 z-[1001] flex flex-col gap-1">
            <button
              onClick={() => mapInstance.current?.zoomIn()}
              className="w-9 h-9 bg-white rounded-xl shadow flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-gray-50 border border-gray-100 leading-none"
            >
              +
            </button>
            <button
              onClick={() => mapInstance.current?.zoomOut()}
              className="w-9 h-9 bg-white rounded-xl shadow flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-gray-50 border border-gray-100 leading-none"
            >
              −
            </button>
          </div>

          {/* GPS Denied / Initial Overlay */}
          {!hasLocation && (
            <div className="absolute inset-0 bg-white/95 z-[1500] flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Navigation
                  size={30}
                  className="text-neutral-800 animate-bounce"
                />
              </div>
              <h2 className="text-xl font-bold mb-2 tracking-tight font-[font3] text-neutral-900">
                Find your location
              </h2>
              <p className="text-sm text-gray-500 font-[font3] mb-8">
                We'll centre the map on your home so you can pin your rooftop
              </p>
              <button
                onClick={handleGPS}
                disabled={gpsLoading}
                className="w-full bg-neutral-900 text-white font-semibold py-4 rounded-2xl font-[font3] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {gpsLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation size={16} />
                )}
                {gpsLoading ? "Getting location…" : "Use my current location"}
              </button>

              <button
                onClick={() => setHasLocation(true)}
                className="mt-6 text-sm text-gray-500 underline font-medium hover:text-neutral-800 transition-colors"
              >
                Skip and select manually on map
              </button>
            </div>
          )}
        </div>

        {/* Footer / Address confirmation */}
        {hasLocation && (
          <div className="px-5 py-4 flex-shrink-0 border-t bg-white">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Home size={15} className="text-neutral-700" />
              </div>
              <div className="flex-1 min-w-0">
  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 font-[font3]">Pin location</p>
  {loadingAddr ? (
    <div className="space-y-1.5">
      <div className="h-3.5 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
    </div>
  ) : (
    <p className="text-sm font-semibold text-neutral-900 leading-snug font-[font3] line-clamp-2">
      {/* 👈 If address contains 'Pinned Location', show a helpful prompt instead */}
      {address.includes("Pinned Location") 
        ? "Move the map or type address manually" 
        : (address || "Move the map to your rooftop")}
    </p>
  )}
</div>
            </div>

            {/* Always allow the user to manually edit the fetched address or coordinates */}
            {!loadingAddr && (
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-[font3] text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-900 resize-none leading-relaxed"
                placeholder="Edit address, add flat no., building name…"
              />
            )}

            <button
              onClick={handleConfirm}
              disabled={loadingAddr || !address}
              className="w-full bg-neutral-900 text-white py-3.5 rounded-2xl font-semibold text-sm font-[font3] hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Confirm this location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLocationPicker;
