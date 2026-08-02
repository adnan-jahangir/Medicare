import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';

// Fix for default Leaflet icon not appearing correctly in some environments
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  orderId: string;
  pickup: any;        // Could be [lng, lat], {lat, lng}, or contain strings
  destination: any;   // Same flexibility
  deliveryAddress?: any;
  progress: number;   // 0..1
  driverLocation?: [number, number] | null;
  routeCoords?: [number, number][];
}

const CHITTAGONG_FALLBACK: [number, number] = [22.3568, 91.7832];

// ─── Coordinate Helpers ──────────────────────────────────────────────

/** Safely coerce any value to a finite number, returning 0 on failure */
const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Parse any coordinate shape into a [lat, lng] tuple with Number() coercion */
const getCoords = (coord: any): [number, number] => {
  if (Array.isArray(coord)) {
    // Convention: arrays are [lng, lat] (GeoJSON / Mongo style)
    return [toNum(coord[1]), toNum(coord[0])];
  }
  if (coord && typeof coord === 'object') {
    return [toNum(coord.lat), toNum(coord.lng)];
  }
  return [0, 0];
};

/** Check if a [lat, lng] pair represents a real location (not 0,0 placeholder) */
const isValidCoord = (c: [number, number]): boolean => {
  return c[0] !== 0 || c[1] !== 0;
};

// ─── Map Child Components ────────────────────────────────────────────

/** Smoothly animates the driver marker from its current position to a new target */
const SmoothDriverMarker = ({ targetPos }: { targetPos: [number, number] }) => {
  const [currentPos, setCurrentPos] = useState<[number, number]>(targetPos);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<[number, number]>(targetPos);
  const startTimeRef = useRef<number>(0);
  const duration = 3000;

  useEffect(() => {
    startPosRef.current = currentPos;
    startTimeRef.current = Date.now();

    if (animationRef.current) clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      const lat = startPosRef.current[0] + (targetPos[0] - startPosRef.current[0]) * t;
      const lng = startPosRef.current[1] + (targetPos[1] - startPosRef.current[1]) * t;

      setCurrentPos([lat, lng]);

      if (t >= 1) {
        if (animationRef.current) clearInterval(animationRef.current);
      }
    }, 50);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [targetPos]);

  const driverIcon = L.divIcon({
    className: 'custom-driver-icon',
    html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  if (!isValidCoord(currentPos)) return null;

  return <Marker position={currentPos} icon={driverIcon} />;
};

/** Auto-fits map bounds to keep driver and destination visible */
const MapAutoBounds = ({ driverPos, destPos }: { driverPos: [number, number]; destPos: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    if (!isValidCoord(driverPos) || !isValidCoord(destPos)) return;

    const driverLatLng = L.latLng(driverPos[0], driverPos[1]);
    const destLatLngObj = L.latLng(destPos[0], destPos[1]);
    const distanceMeter = driverLatLng.distanceTo(destLatLngObj);

    if (distanceMeter > 200) {
      map.fitBounds([driverLatLng, destLatLngObj], {
        padding: [80, 80],
        animate: true
      });
    }
  }, [driverPos, destPos, map]);

  return null;
};

/**
 * Re-centers the map when coordinates load/change after the initial mount.
 * MapContainer only reads `center` on first render, so we need this to
 * handle the async data-loading case.
 */
const MapRecenter = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  const lastCenterRef = useRef<string>('');

  useEffect(() => {
    if (!isValidCoord(center)) return;

    const centerStr = JSON.stringify(center);
    if (lastCenterRef.current !== centerStr) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true });
      lastCenterRef.current = centerStr;
    }
  }, [center, zoom, map]);

  return null;
};

// ─── Main Component ──────────────────────────────────────────────────

export const LiveDeliveryMap = ({ orderId, pickup, destination, deliveryAddress, progress, driverLocation, routeCoords }: Props) => {

  const pickupLatLng = getCoords(pickup);
  const rawDest = getCoords(deliveryAddress);
  const destLatLng = isValidCoord(rawDest) ? rawDest : getCoords(destination);

  const pickupValid = isValidCoord(pickupLatLng);
  const destValid = isValidCoord(destLatLng);

  const [internalDriverPos, setInternalDriverPos] = useState<[number, number]>(pickupLatLng);
  const [currentRoute, setCurrentRoute] = useState<[number, number][]>([]);
  const [driverTrail, setDriverTrail] = useState<[number, number][]>([]);

  // Update internal state when the pickup prop changes (async load)
  useEffect(() => {
    if (pickupValid) {
      setInternalDriverPos(prev => {
        // Only reset if we're still at [0,0]
        if (!isValidCoord(prev)) return pickupLatLng;
        return prev;
      });
    }
  }, [pickupLatLng[0], pickupLatLng[1], pickupValid]);

  // Fetch real road route from OSRM
  useEffect(() => {
    if (!pickupValid || !destValid) return;

    const fetchRoute = async () => {
      // OSRM wants lng,lat order
      const p_lng = pickupLatLng[1];
      const p_lat = pickupLatLng[0];
      const d_lng = destLatLng[1];
      const d_lat = destLatLng[0];

      if (!p_lng || !p_lat || !d_lng || !d_lat) return;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${p_lng},${p_lat};${d_lng},${d_lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: any) => [toNum(c[1]), toNum(c[0])]
          );
          setCurrentRoute(coords);
        }
      } catch (err) {
        console.error("OSRM Fetch Error:", err);
      }
    };
    fetchRoute();
  }, [pickupLatLng[0], pickupLatLng[1], destLatLng[0], destLatLng[1], pickupValid, destValid]);

  // React to live driver location updates
  useEffect(() => {
    if (driverLocation) {
      const safeDriverLoc: [number, number] = [toNum(driverLocation[0]), toNum(driverLocation[1])];
      setInternalDriverPos(safeDriverLoc);

      setDriverTrail(prev => {
        const newTrail = [...prev, safeDriverLoc];
        if (newTrail.length > 20) return newTrail.slice(newTrail.length - 20);
        return newTrail;
      });

      if (routeCoords && routeCoords.length > 0) {
        let minDist = Infinity;
        let closestIdx = 0;

        routeCoords.forEach((coord, idx) => {
          const d = Math.pow(toNum(coord[0]) - safeDriverLoc[0], 2) +
                    Math.pow(toNum(coord[1]) - safeDriverLoc[1], 2);
          if (d < minDist) {
            minDist = d;
            closestIdx = idx;
          }
        });

        setCurrentRoute(routeCoords.slice(closestIdx));
      }
    } else if (pickupValid && destValid) {
      const lat = pickupLatLng[0] + (destLatLng[0] - pickupLatLng[0]) * progress;
      const lng = pickupLatLng[1] + (destLatLng[1] - pickupLatLng[1]) * progress;
      setInternalDriverPos([lat, lng]);
    }
  }, [driverLocation, progress, routeCoords, pickupLatLng[0], pickupLatLng[1], destLatLng[0], destLatLng[1], pickupValid, destValid]);

  // Custom icons
  const pharmacyIcon = L.divIcon({
    className: 'pharmacy-icon',
    html: `<div style="background-color: #0d9488; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const homeIcon = L.divIcon({
    className: 'home-icon',
    html: `<div style="background-color: #14532d; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  // Determine the best initial center for the map
  const initialCenter: [number, number] = destValid
    ? destLatLng
    : pickupValid
      ? pickupLatLng
      : CHITTAGONG_FALLBACK;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-card h-[420px] w-full">
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-0"
      >
        {/* Re-center the map when coordinates load after mount */}
        <MapRecenter center={destValid ? destLatLng : (pickupValid ? pickupLatLng : CHITTAGONG_FALLBACK)} zoom={14} />

        {/* Auto-fit bounds when driver is moving */}
        {isValidCoord(internalDriverPos) && destValid && (
          <MapAutoBounds driverPos={internalDriverPos} destPos={destLatLng} />
        )}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Driver Trail (Recent History) */}
        {driverTrail.length > 1 && (
          <Polyline
            positions={driverTrail}
            color="#10b981"
            weight={3}
            opacity={0.4}
            dashArray="1, 5"
          />
        )}

        {/* Route Line */}
        {currentRoute.length > 0 ? (
          <Polyline positions={currentRoute} color="#10b981" weight={5} opacity={0.8} />
        ) : (pickupValid && destValid) ? (
          <Polyline positions={[pickupLatLng, destLatLng]} color="#10b981" weight={4} opacity={0.6} dashArray="10, 10" />
        ) : null}

        {/* Pickup Marker — only render when valid */}
        {pickupValid && (
          <Marker position={pickupLatLng} icon={pharmacyIcon} />
        )}

        {/* Destination Marker — only render when valid */}
        {destValid && (
          <Marker position={destLatLng} icon={homeIcon} />
        )}

        {/* Driver Marker — only render when valid */}
        {isValidCoord(internalDriverPos) && (
          <SmoothDriverMarker targetPos={internalDriverPos} />
        )}

      </MapContainer>

      <div className="absolute top-3 left-3 pill bg-card/90 backdrop-blur shadow-sm z-[1000]">
        <MapPin className="h-3 w-3 text-primary" />
        <span className="text-xs font-semibold ml-1">Live tracking</span>
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft ml-1" />
      </div>
    </div>
  );
};
