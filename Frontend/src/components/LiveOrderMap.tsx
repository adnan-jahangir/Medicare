/**
 * LiveOrderMap — Self-contained, real-time delivery tracking map component.
 *
 * Features:
 *   ✓ Connects to Socket.io and joins the order tracking room on mount
 *   ✓ Smoothly animates the driver marker between GPS updates (lerp)
 *   ✓ Renders pharmacy pickup, customer destination, and driver markers
 *   ✓ Shows a live progress bar driven by `driverProgress`
 *   ✓ Status badge updates in real-time via `order:statusChanged`
 *   ✓ Reconnects gracefully (re-joins room after socket drop)
 *   ✓ Fallback / loading skeleton before first location update
 *   ✓ Fetches real road route from OSRM for the polyline
 *   ✓ Driver trail (breadcrumb) of recent positions
 *   ✓ All socket listeners cleaned up on unmount
 *
 * Map: Leaflet + OpenStreetMap (no API key needed).
 * Config: Socket URL pulled from VITE_SOCKET_URL env var.
 *
 * Usage:
 *   <LiveOrderMap
 *     orderId={order.id}
 *     pharmacyLocation={{ lat: 22.35, lng: 91.78 }}
 *     deliveryLocation={{ lat: 22.36, lng: 91.80 }}
 *     initialProgress={order.driverProgress}
 *     initialStatus={order.status}
 *   />
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import {
  Truck,
  MapPin,
  Home,
  Loader2,
  WifiOff,
  CheckCircle2,
  Package,
  ChefHat,
  Navigation,
} from 'lucide-react';

// Fix default Leaflet marker icon paths cleanly using CDN fallbacks
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch (e) {
  console.warn('[LiveOrderMap] Leaflet icon init fallback', e);
}

// ─── Types ──────────────────────────────────────────────────────────────

interface LatLng {
  lat: number;
  lng: number;
}

interface LiveOrderMapProps {
  /** MongoDB order _id / id */
  orderId: string;
  /** Pharmacy / pickup coordinates */
  pharmacyLocation: LatLng | [number, number] | null | undefined;
  /** Customer / delivery coordinates */
  deliveryLocation: LatLng | [number, number] | null | undefined;
  /** Initial driver progress 0-1 (from the order document) */
  initialProgress?: number;
  /** Initial status string (from the order document) */
  initialStatus?: string;
  /** Optional: CSS class for the container */
  className?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const FALLBACK_CENTER: [number, number] = [22.3568, 91.7832]; // Chittagong
const LERP_DURATION_MS = 400; // animation duration per location update (matches fast updates)
const LERP_STEP_MS = 16; // ~60 fps
const TRAIL_MAX_LENGTH = 30;
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ─── Coordinate helpers ─────────────────────────────────────────────────

/** Safely coerce any value to a finite number */
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Normalize any coord shape to [lat, lng] */
const normalize = (c: LatLng | [number, number] | null | undefined): [number, number] => {
  if (!c) return [0, 0];
  if (Array.isArray(c)) {
    // GeoJSON / Mongo convention: [lng, lat]
    return [toNum(c[1]), toNum(c[0])];
  }
  return [toNum(c.lat), toNum(c.lng)];
};

const isValid = (c: [number, number]): boolean => c[0] !== 0 || c[1] !== 0;

// ─── Status config (label + color + icon) ───────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
  'Pending':          { label: 'Order Placed',     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',  icon: Package },
  'Confirmed':        { label: 'Confirmed',        color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',    icon: CheckCircle2 },
  'Preparing':        { label: 'Preparing',        color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',icon: ChefHat },
  'Ready':            { label: 'Ready for Pickup',  color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',    icon: Package },
  'Driver Assigned':  { label: 'Driver Assigned',   color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',icon: Truck },
  'Picked Up':        { label: 'Picked Up',         color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',icon: Truck },
  'On the Way':       { label: 'On the Way',        color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',icon: Navigation },
  'Arrived':          { label: 'Arrived',           color: 'text-green-600',   bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',  icon: Home },
  'Delivered':        { label: 'Delivered',         color: 'text-green-700',   bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',  icon: CheckCircle2 },
  'Completed':        { label: 'Completed',         color: 'text-green-700',   bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',  icon: CheckCircle2 },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: Package };

// ─── Custom Leaflet icons ───────────────────────────────────────────────

const pharmacyIcon = L.divIcon({
  className: 'live-order-pharmacy-icon',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #0d9488, #14b8a6);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(13,148,136,0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 13h.01"/><path d="M9 17h.01"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const homeIcon = L.divIcon({
  className: 'live-order-home-icon',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(124,58,237,0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = L.divIcon({
  className: 'live-order-driver-icon',
  html: `<div style="
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(16,185,129,0.3), 0 6px 16px rgba(16,185,129,0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5"/>
      <circle cx="18.5" cy="17.5" r="2.5"/>
      <path d="M15 6h2.5l1.5 4-3 1.5M9 17.5h7M5.5 17.5l3-6.5h4.5l2 3.5h3.5"/>
      <path d="M2 9h4v3H2z" fill="white" fill-opacity="0.4"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// ─── Sub-components ─────────────────────────────────────────────────────

/**
 * SmoothDriverMarker — Lerps the marker position between old → new
 * coordinates over LERP_DURATION_MS instead of jumping instantly.
 */
const SmoothDriverMarker = ({ target }: { target: [number, number] }) => {
  const [pos, setPos] = useState<[number, number]>(target);
  const startRef = useRef<[number, number]>(target);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Capture the starting position when target changes
    startRef.current = pos;
    startTimeRef.current = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / LERP_DURATION_MS, 1);
      // Ease-out cubic for smooth deceleration
      const ease = 1 - Math.pow(1 - t, 3);

      const lat = startRef.current[0] + (target[0] - startRef.current[0]) * ease;
      const lng = startRef.current[1] + (target[1] - startRef.current[1]) * ease;
      setPos([lat, lng]);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target[0], target[1]]);

  if (!isValid(pos)) return null;

  return <Marker position={pos} icon={driverIcon} zIndexOffset={1000} />;
};

/**
 * MapFitter — Adjusts the map bounds to keep all markers visible.
 * Re-fits whenever pickup, destination, or driver position changes significantly.
 */
const MapFitter = ({
  points,
}: {
  points: [number, number][];
}) => {
  const map = useMap();
  const lastBoundsRef = useRef('');

  useEffect(() => {
    const validPoints = points.filter(isValid);
    if (validPoints.length < 2) {
      if (validPoints.length === 1) {
        map.setView(validPoints[0], 15, { animate: true });
      }
      return;
    }

    const key = validPoints.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');
    if (lastBoundsRef.current === key) return;
    lastBoundsRef.current = key;

    const bounds = L.latLngBounds(validPoints.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
  }, [points, map]);

  return null;
};

// ─── Main Component ─────────────────────────────────────────────────────

export function LiveOrderMap({
  orderId,
  pharmacyLocation,
  deliveryLocation,
  initialProgress = 0,
  initialStatus = 'Pending',
  className,
}: LiveOrderMapProps) {
  // ── Normalize coords ────────────────────────────────────────────────
  const pickup = useMemo(() => normalize(pharmacyLocation), [pharmacyLocation]);
  const dest = useMemo(() => normalize(deliveryLocation), [deliveryLocation]);
  const pickupValid = isValid(pickup);
  const destValid = isValid(dest);

  // ── Socket hook — manages connection, room, listeners, cleanup ──────
  const {
    driverLocation,
    driverProgress: socketDriverProgress,
    socketStatus,
    isConnected,
    hasReceivedLocation,
  } = useOrderSocket(orderId);

  // ── Local state ─────────────────────────────────────────────────────
  const [driverPos, setDriverPos] = useState<[number, number]>(() => {
    if (pickupValid && destValid) {
      return [
        pickup[0] + (dest[0] - pickup[0]) * initialProgress,
        pickup[1] + (dest[1] - pickup[1]) * initialProgress,
      ];
    }
    return pickup;
  });

  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState(initialStatus);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [trail, setTrail] = useState<[number, number][]>([]);

  // ── React to socket location updates ────────────────────────────────
  useEffect(() => {
    if (!driverLocation) return;

    const newPos: [number, number] = [driverLocation.lat, driverLocation.lng];
    setDriverPos(newPos);

    // Append to breadcrumb trail
    setTrail((prev) => {
      const next = [...prev, newPos];
      return next.length > TRAIL_MAX_LENGTH ? next.slice(-TRAIL_MAX_LENGTH) : next;
    });

    // If the backend sent an authoritative driverProgress, use it directly.
    // Otherwise fall back to estimating progress from distance.
    if (socketDriverProgress !== null) {
      setProgress(socketDriverProgress);
    } else if (pickupValid && destValid) {
      const totalDist = Math.hypot(dest[0] - pickup[0], dest[1] - pickup[1]);
      if (totalDist > 0) {
        const coveredDist = Math.hypot(newPos[0] - pickup[0], newPos[1] - pickup[1]);
        setProgress(Math.min(coveredDist / totalDist, 1));
      }
    }
  }, [driverLocation, socketDriverProgress, pickup, dest, pickupValid, destValid]);

  // ── React to socket status updates ──────────────────────────────────
  useEffect(() => {
    if (socketStatus) {
      setStatus(socketStatus);
    }
  }, [socketStatus]);

  // ── Sync with prop changes (e.g., parent re-fetches order) ──────────
  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // ── Compute driver position along OSRM road route or direct socket GPS ──
  useEffect(() => {
    // 1. If we have valid pickup & destination coordinates, calculate position along the road route from progress
    if (pickupValid && destValid) {
      if (route.length > 1) {
        const clamped = Math.max(0, Math.min(1, progress));
        const idxFloat = clamped * (route.length - 1);
        const idx = Math.floor(idxFloat);
        const frac = idxFloat - idx;
        const p1 = route[idx];
        const p2 = route[Math.min(idx + 1, route.length - 1)];
        setDriverPos([
          p1[0] + (p2[0] - p1[0]) * frac,
          p1[1] + (p2[1] - p1[1]) * frac,
        ]);
        return;
      } else {
        setDriverPos([
          pickup[0] + (dest[0] - pickup[0]) * progress,
          pickup[1] + (dest[1] - pickup[1]) * progress,
        ]);
        return;
      }
    }

    // 2. Fallback to direct GPS coordinates from Socket.io if pickup/dest route is not available
    if (driverLocation && typeof driverLocation.lat === 'number' && typeof driverLocation.lng === 'number' && driverLocation.lat !== 0) {
      setDriverPos([driverLocation.lat, driverLocation.lng]);
    }
  }, [progress, route, pickup[0], pickup[1], dest[0], dest[1], pickupValid, destValid, driverLocation?.lat, driverLocation?.lng]);

  // ── Fetch road route from OSRM ──────────────────────────────────────
  useEffect(() => {
    if (!pickupValid || !destValid) return;

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        // OSRM expects lng,lat order
        const url = `${OSRM_BASE}/${pickup[1]},${pickup[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();

        if (!cancelled && json.routes?.[0]) {
          const coords: [number, number][] = json.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [toNum(c[1]), toNum(c[0])]
          );
          setRoute(coords);
        }
      } catch (err) {
        console.warn('[LiveOrderMap] OSRM route fetch failed:', err);
      }
    };

    fetchRoute();
    return () => { cancelled = true; };
  }, [pickup[0], pickup[1], dest[0], dest[1], pickupValid, destValid]);

  // ── Derive initial map center ───────────────────────────────────────
  const center: [number, number] = destValid
    ? dest
    : pickupValid
      ? pickup
      : FALLBACK_CENTER;

  // Points used for auto-fitting bounds
  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (pickupValid) pts.push(pickup);
    if (destValid) pts.push(dest);
    if (isValid(driverPos)) pts.push(driverPos);
    return pts;
  }, [pickup, dest, driverPos, pickupValid, destValid]);

  const statusCfg = getStatusConfig(status);
  const StatusIcon = statusCfg.icon;

  const isDeliveryActive = [
    'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived',
  ].includes(status);

  // ── Calculate ETA and distance ──────────────────────────────────────
  const trackingInfo = useMemo(() => {
    if (!isDeliveryActive || !isValid(driverPos) || !destValid) return null;

    const R = 6371; // km
    const dLat = ((dest[0] - driverPos[0]) * Math.PI) / 180;
    const dLng = ((dest[1] - driverPos[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((driverPos[0] * Math.PI) / 180) *
        Math.cos((dest[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const eta = Math.max(1, Math.ceil((dist / 20) * 60)); // 20 km/h avg

    return {
      distance: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
      eta: `${eta} min`,
    };
  }, [driverPos, dest, destValid, isDeliveryActive]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={cn('relative rounded-2xl overflow-hidden border border-border shadow-card', className)} style={{ minHeight: 420 }}>

      {/* ─── Loading skeleton (before any data) ─────────────────────── */}
      {!pickupValid && !destValid && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Loading map…</p>
        </div>
      )}

      {/* ─── Map ────────────────────────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%', minHeight: 420 }}
        zoomControl={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Auto-fit bounds to all markers */}
        {fitPoints.length >= 2 && <MapFitter points={fitPoints} />}

        {/* Road route polyline */}
        {route.length > 1 && (
          <Polyline positions={route} color="#10b981" weight={5} opacity={0.7} />
        )}

        {/* Fallback straight line when OSRM fails */}
        {route.length === 0 && pickupValid && destValid && (
          <Polyline positions={[pickup, dest]} color="#10b981" weight={4} opacity={0.5} dashArray="10, 10" />
        )}

        {/* Driver trail (breadcrumb of recent positions) */}
        {trail.length > 1 && (
          <Polyline positions={trail} color="#10b981" weight={3} opacity={0.35} dashArray="2, 6" />
        )}

        {/* Pharmacy marker */}
        {pickupValid && <Marker position={pickup} icon={pharmacyIcon} />}

        {/* Destination marker */}
        {destValid && <Marker position={dest} icon={homeIcon} />}

        {/* Driver marker (animated) */}
        {isValid(driverPos) && <SmoothDriverMarker target={driverPos} />}
      </MapContainer>

      {/* ─── Top-left: Connection status pill ───────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <div className="pill bg-card/90 backdrop-blur-md shadow-sm">
          {isConnected ? (
            <>
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold">Live tracking</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">Reconnecting…</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Top-right: Status badge ────────────────────────────────── */}
      <div className={cn(
        'absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-md shadow-sm transition-all duration-300',
        statusCfg.bg,
      )}>
        <StatusIcon className={cn('h-3.5 w-3.5', statusCfg.color)} />
        <span className={cn('text-xs font-bold', statusCfg.color)}>{statusCfg.label}</span>
      </div>

      {/* ─── Top-right stacked: ETA pill (below status badge) ───────── */}
      {trackingInfo && (
        <div className="absolute top-12 right-3 z-[1000] flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/90 backdrop-blur-md px-2.5 py-1 shadow-sm">
            <Truck className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">{trackingInfo.distance}</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/90 backdrop-blur-md px-2.5 py-1 shadow-sm">
            <span className="text-[11px] text-muted-foreground italic">ETA</span>
            <span className="text-[11px] font-bold text-primary">{trackingInfo.eta}</span>
          </div>
        </div>
      )}

      {/* ─── Bottom: Progress bar ───────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <div className="h-1.5 w-full bg-border/60 backdrop-blur">
          <div
            className="h-full rounded-r-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(2, progress * 100)}%`,
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
            }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-md border-t border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Delivery progress
          </span>
          <span className="text-[11px] font-bold text-primary tabular-nums">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default LiveOrderMap;
