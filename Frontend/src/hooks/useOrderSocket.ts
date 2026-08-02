/**
 * useOrderSocket — Socket.io hook for live order tracking.
 *
 * Responsibilities:
 *   1. Connect to the Socket.io server with JWT auth on mount.
 *   2. Join the `order:${orderId}` + `room_${orderId}` tracking rooms.
 *   3. Listen for `location_changed`, `order:driverLocation`, and
 *      `order:statusChanged` events and expose the latest values.
 *   4. On socket reconnect, automatically rejoin the rooms.
 *   5. Clean up **all** listeners and disconnect on unmount.
 *
 * The hook intentionally does NOT create a global socket singleton — each
 * tracking page gets its own connection so multiple tabs don't fight.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

// ─── Types ──────────────────────────────────────────────────────────────

export interface DriverLocationPayload {
  lat: number;
  lng: number;
  updatedAt?: string | Date;
  orderId?: string;
}

export interface OrderStatusPayload {
  status: string;
  orderId?: string;
}

export interface UseOrderSocketReturn {
  /** Latest driver GPS coordinates, or null before first update */
  driverLocation: DriverLocationPayload | null;
  /** Latest driverProgress (0-1) received over the socket, or null */
  driverProgress: number | null;
  /** Latest order status string received over the socket */
  socketStatus: string | null;
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Whether we've received at least one location update */
  hasReceivedLocation: boolean;
}

// ─── Helper: read the JWT from persisted Zustand store ──────────────────

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('medicare-store');
    if (!raw) return null;
    const { state } = JSON.parse(raw);
    return state?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Socket URL from env (falls back to window.location origin) ─────────

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ??
  'https://medicare-rv55.onrender.com';

// ─── Hook ───────────────────────────────────────────────────────────────

export function useOrderSocket(orderId: string | undefined): UseOrderSocketReturn {
  const [driverLocation, setDriverLocation] = useState<DriverLocationPayload | null>(null);
  const [driverProgress, setDriverProgress] = useState<number | null>(null);
  const [socketStatus, setSocketStatus] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasReceivedLocation, setHasReceivedLocation] = useState(false);

  // Keep a stable ref to the current orderId so reconnect handlers always
  // see the latest value without re-registering the listener.
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  // Ref to the socket instance for cleanup.
  const socketRef = useRef<Socket | null>(null);

  // Stable callback that joins both backend rooms for the current orderId.
  const joinRoom = useCallback((socket: Socket) => {
    const id = orderIdRef.current;
    if (!id) return;

    // Primary room join (RBAC-checked on server)
    socket.emit('join_room', { orderId: id });

    // Legacy backward-compat events the server also listens for
    socket.emit('customer:watchOrder', { orderId: id });
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const token = getToken();

    // Create the socket connection with auth.
    const socket = io(SOCKET_URL, {
      auth: { token: token ? `Bearer ${token}` : undefined },
      query: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────

    socket.on('connect', () => {
      setIsConnected(true);
      joinRoom(socket);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Automatically rejoin rooms after a reconnect.
    socket.io.on('reconnect', () => {
      setIsConnected(true);
      joinRoom(socket);
    });

    // ── Data listeners ───────────────────────────────────────────────
    //
    // The backend emits two different payload shapes for location:
    //   1. From socket handler (index.ts driver_location_update):
    //      { orderId, lat, lng, updatedAt }            ← flat
    //   2. From REST route (PATCH /:id/driver-progress):
    //      { orderId, driverProgress, currentLocation: { lat, lng, updatedAt } } ← nested
    //
    // Both handlers below normalize either shape.

    /** Extract {lat, lng} from either flat or nested payload */
    const extractLocation = (data: any): DriverLocationPayload | null => {
      if (!data) return null;

      // Shape 1: flat { lat, lng }
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { lat: data.lat, lng: data.lng, updatedAt: data.updatedAt, orderId: data.orderId };
      }

      // Shape 2: nested { currentLocation: { lat, lng } }
      const cl = data.currentLocation;
      if (cl && typeof cl.lat === 'number' && typeof cl.lng === 'number') {
        return { lat: cl.lat, lng: cl.lng, updatedAt: cl.updatedAt, orderId: data.orderId };
      }

      return null;
    };

    /** Extract driverProgress if present in the payload */
    const extractProgress = (data: any): void => {
      if (data && typeof data.driverProgress === 'number') {
        setDriverProgress(data.driverProgress);
      }
    };

    // Primary location event
    const handleLocationChanged = (data: any) => {
      const loc = extractLocation(data);
      if (!loc) return;
      setDriverLocation(loc);
      setHasReceivedLocation(true);
      extractProgress(data);
    };

    // Legacy / backward-compat location event
    const handleDriverLocation = (data: any) => {
      const loc = extractLocation(data);
      if (!loc) return;
      setDriverLocation(loc);
      setHasReceivedLocation(true);
      extractProgress(data);
    };

    // Order status changes
    const handleStatusChanged = (data: OrderStatusPayload) => {
      if (!data?.status) return;
      setSocketStatus(data.status);
    };

    socket.on('location_changed', handleLocationChanged);
    socket.on('order:driverLocation', handleDriverLocation);
    socket.on('order:statusChanged', handleStatusChanged);

    // Silently handle auth / connection errors so the UI doesn't crash.
    socket.on('connect_error', (err) => {
      console.warn('[useOrderSocket] connect_error:', err.message);
    });

    socket.on('error_message', (data: { message: string }) => {
      console.warn('[useOrderSocket] server error:', data.message);
    });

    // ── Cleanup ──────────────────────────────────────────────────────

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('location_changed', handleLocationChanged);
      socket.off('order:driverLocation', handleDriverLocation);
      socket.off('order:statusChanged', handleStatusChanged);
      socket.off('connect_error');
      socket.off('error_message');
      socket.io.off('reconnect');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, joinRoom]);

  return { driverLocation, driverProgress, socketStatus, isConnected, hasReceivedLocation };
}
