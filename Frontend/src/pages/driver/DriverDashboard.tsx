import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { io } from 'socket.io-client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MapPin, Phone, CheckCircle2, Package, Navigation, Loader2, User, Truck,
  Clock, Star, TrendingUp, DollarSign, Calendar, Route, ShieldCheck, CircleDot,
  ChevronRight, AlertCircle, PackageCheck
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import api from '@/lib/api';
import { EditProfileDialog } from '@/components/EditProfileDialog';

const LiveOrderMap = lazy(() =>
  import('@/components/LiveOrderMap').then((m) => ({ default: m.LiveOrderMap }))
);

export default function DriverDashboard() {
  const { user, token } = useAppStore();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [wallet, setWallet] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<any>(null);
  const activeOrderIdRef = useRef<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    connectSocket();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch {}
      }
    };
  }, []);

  const connectSocket = () => {
    try {
      if (!token) return;
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://medicare-rv55.onrender.com';
      socketRef.current = io(socketUrl, {
        auth: { token: `Bearer ${token}` },
        query: { token },
        timeout: 3000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current.on('connect', () => {
        console.log('[Driver Socket Connected]');
        if (activeOrderIdRef.current) {
          socketRef.current.emit('join_room', { orderId: activeOrderIdRef.current });
        }
      });

      socketRef.current.on('reconnect', () => {
        console.log('[Driver Socket Reconnected]');
        if (activeOrderIdRef.current) {
          socketRef.current.emit('join_room', { orderId: activeOrderIdRef.current });
        }
      });

      // Listen for new ready orders
      socketRef.current.on('order:newAvailable', (data: any) => {
        toast.info(`New delivery available from ${data.pharmacyName || 'a pharmacy'}!`, {
          icon: <Package className="h-4 w-4" />,
        });
        // Just refresh the available list instead of full reload
        api.get('/delivery/available').then(res => {
          setAvailableOrders(res.data.data || []);
        });
      });
    } catch (err) {
      console.error('Socket connection failed', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availableRes, activeRes, profileRes, historyRes] = await Promise.allSettled([
        api.get('/delivery/available'),
        api.get('/delivery/active'),
        api.get('/users/profile'),
        api.get('/delivery/history')
      ]);

      if (availableRes.status === 'fulfilled') {
        setAvailableOrders(availableRes.value.data?.data || []);
      }
      if (activeRes.status === 'fulfilled') {
        const activeData = activeRes.value.data?.data || null;
        setActiveOrder(activeData);
        if (activeData) {
          startTracking(activeData._id || activeData.id);
        } else {
          activeOrderIdRef.current = null;
        }
      }
      if (profileRes.status === 'fulfilled') {
        setWallet(profileRes.value.data?.data?.wallet || 0);
      }
      if (historyRes.status === 'fulfilled') {
        setCompletedOrders(historyRes.value.data?.data || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = (orderId: string) => {
    activeOrderIdRef.current = orderId;
    
    // Join tracking room immediately if socket is ready
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_room', { orderId });
    }

    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    
    let lastEmitTime = 0;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Ignore browser IP geolocation updates while dev simulation is running
        if (isSimulatingRef.current) return;

        setGeoError(null);
        let { latitude: lat, longitude: lng } = pos.coords;

        // Filter out desktop browser ISP IP fallback (Sitakunda 22.5+ lat) on PCs without hardware GPS
        if (lat > 22.50) {
          lat = activeOrder?.pickup?.lat || 22.3568;
          lng = activeOrder?.pickup?.lng || 91.7832;
        }

        const now = Date.now();
        // Rate-limit coordinates updates to socket to once every 2 seconds
        if (now - lastEmitTime > 2000) {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('driver_location_update', { orderId, lat, lng });
            lastEmitTime = now;
          }
        }
      },
      (err) => {
        console.error('Geo error:', err);
        if (err.code === 1) {
          setGeoError('Location permission denied. Please enable location access in browser settings.');
        } else if (err.code === 2) {
          setGeoError('GPS signal unavailable. Ensure location services are enabled.');
        } else {
          setGeoError('Geolocation timeout while acquiring position.');
        }
      },
      { enableHighAccuracy: true }
    );
  };

  const acceptOrder = async (id: string) => {
    // Optimistic UI Update: snap immediately
    const target = availableOrders.find(o => (o._id || o.id) === id);
    if (target) {
      setActiveOrder({ ...target, status: 'Driver Assigned' });
      setAvailableOrders(prev => prev.filter(o => (o._id || o.id) !== id));
      toast.success('Order accepted! Head to pharmacy.');
      startTracking(id);
    }
    try {
      const res = await api.post(`/delivery/accept/${id}`);
      if (res.data?.data) setActiveOrder(res.data.data);
    } catch (err: any) {
      fetchData();
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const updateStatus = async (status: string) => {
    const orderId = activeOrder?._id || activeOrder?.id;
    if (!orderId) return;

    // Optimistic UI Update
    setActiveOrder((prev: any) => prev ? { ...prev, status } : null);

    try {
      const res = await api.patch(`/delivery/status/${orderId}`, { status });
      if (res.data?.data) {
        setActiveOrder(res.data.data);
        toast.success(`Status updated: ${status}`);
      }
    } catch (err: any) {
      console.error('[Status update failed]', err);
      toast.error(err.response?.data?.message || 'Status update failed');
      fetchData();
    }
  };

  const verifyOtp = async () => {
    try {
      const orderId = activeOrder._id || activeOrder.id;
      await api.post(`/delivery/verify-otp/${orderId}`, { otp });
      toast.success('Delivery Completed! ৳35 added to wallet.');
      setActiveOrder(null);
      activeOrderIdRef.current = null;
      setOtp('');
      stopSimulation();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setWallet(prev => prev + 35);
      fetchData();
    } catch (err) {
      toast.error('Invalid OTP');
    }
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const stopSimulation = () => {
    isSimulatingRef.current = false;
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  const startSimulation = () => {
    if (!activeOrder) return;
    isSimulatingRef.current = true;
    setIsSimulating(true);
    
    // Always start simulation from 0% (Pharmacy location)
    let currentProgress = 0;
    const orderId = activeOrder._id || activeOrder.id;

    // Pause real browser geolocation watch while simulation is active
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Extract start (Pharmacy) and end (Customer) coordinates
    let startLat = Number(activeOrder.pickup?.lat);
    let startLng = Number(activeOrder.pickup?.lng);
    let endLat = Number(activeOrder.destination?.lat ?? activeOrder.deliveryAddress?.lat);
    let endLng = Number(activeOrder.destination?.lng ?? activeOrder.deliveryAddress?.lng);

    if (!startLat || isNaN(startLat) || startLat === 0) startLat = 22.3568;
    if (!startLng || isNaN(startLng) || startLng === 0) startLng = 91.7832;
    if (!endLat || isNaN(endLat) || endLat === 0) endLat = 22.3668;
    if (!endLng || isNaN(endLng) || endLng === 0) endLng = 91.7932;

    // Ensure there is a minimum distance difference so marker movement is clearly visible
    if (Math.abs(startLat - endLat) < 0.0005 && Math.abs(startLng - endLng) < 0.0005) {
      endLat = startLat + 0.0080;
      endLng = startLng + 0.0080;
    }

    toast.info('Simulated delivery journey started');

    // Immediately snap driver to start (Pharmacy) at 0% progress
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('driver_location_update', { orderId, lat: startLat, lng: startLng });
    }
    api.patch(`/orders/${orderId}/driver-progress`, {
      driverProgress: 0,
      currentLocation: { lat: startLat, lng: startLng },
    }).catch(() => {});

    simulationIntervalRef.current = setInterval(() => {
      currentProgress = Math.min(1, currentProgress + 0.025);

      const lat = startLat + (endLat - startLat) * currentProgress;
      const lng = startLng + (endLng - startLng) * currentProgress;

      // Update local state INSTANTLY without waiting for HTTP network responses
      setActiveOrder((prev: any) =>
        prev
          ? {
              ...prev,
              driverProgress: currentProgress,
              currentLocation: { lat, lng },
            }
          : null
      );

      // 1. Emit live location via Socket immediately
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('driver_location_update', {
          orderId,
          lat,
          lng,
          driverProgress: currentProgress,
        });
      }

      // 2. Persist progress & location via REST API in background
      api
        .patch(`/orders/${orderId}/driver-progress`, {
          driverProgress: currentProgress,
          currentLocation: { lat, lng },
        })
        .catch(() => {});

      if (currentProgress >= 1) {
        stopSimulation();
        // Resume real tracking
        startTracking(orderId);
        // Auto transition status to Arrived when progress reaches 100%
        api
          .patch(`/delivery/status/${orderId}`, { status: 'Arrived' })
          .then((res) => {
            if (res.data?.data) {
              setActiveOrder(res.data.data);
            }
          })
          .catch(() => {});
        toast.success('Simulation completed: Driver has arrived!');
      }
    }, 300);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-4 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  const totalDeliveries = completedOrders.length;

  return (
    <DashboardLayout role="driver" title="Driver Dashboard" subtitle={`Welcome back, ${user?.name || 'Driver'}`}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile Card */}
        <Card className="p-5 border-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-inner">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user?.name || 'Driver'}</h2>
                <button
                  onClick={() => setProfileDialogOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur border border-white/20 transition-all"
                >
                  Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Courier
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                  <span className="font-semibold">{user?.rating || '5.0'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider opacity-70">Status</div>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`mt-1 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isOnline
                  ? 'bg-white/20 text-white'
                  : 'bg-red-500/30 text-red-100'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-red-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
        </Card>

        <EditProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-display font-black tabular-nums">
              <span className="text-[0.7em]">৳</span>{wallet.toFixed(0)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Wallet</div>
          </Card>
          <Card className="p-4 text-center bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-display font-black tabular-nums">{availableOrders.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Available</div>
          </Card>
          <Card className="p-4 text-center bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-display font-black tabular-nums">{activeOrder ? 1 : 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Active</div>
          </Card>
        </div>

        {/* Active Order Card */}
        {activeOrder && (
          <Card className="overflow-hidden border-2 border-primary shadow-lg relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Active Delivery</h3>
                    <span className="text-xs text-muted-foreground">#{(activeOrder._id || '').slice(-6).toUpperCase()}</span>
                  </div>
                </div>
                <Badge className="animate-pulse bg-orange-500 text-white border-none">{activeOrder.status}</Badge>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Embedded Live Map for Driver */}
              <Suspense fallback={<div className="h-64 rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm font-medium">Loading live route map...</div>}>
                <LiveOrderMap
                  orderId={activeOrder._id || activeOrder.id}
                  pharmacyLocation={activeOrder.pickup}
                  deliveryLocation={activeOrder.destination || activeOrder.deliveryAddress}
                  initialProgress={activeOrder.driverProgress || 0}
                  initialStatus={activeOrder.status}
                  className="h-64 w-full rounded-2xl border border-border shadow-sm mb-4"
                />
              </Suspense>

              {geoError && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3 text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">GPS Access Warning</span>
                    <span>{geoError}</span>
                  </div>
                </div>
              )}

              {/* Route visualization */}
              <div className="flex gap-4">
                <div className="w-1 bg-gradient-to-b from-primary to-accent rounded-full relative flex-shrink-0">
                  <div className="absolute top-0 -left-1.5 h-4 w-4 rounded-full bg-primary border-4 border-card" />
                  <div className="absolute bottom-0 -left-1.5 h-4 w-4 rounded-full bg-accent border-4 border-card" />
                </div>
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pickup</p>
                    <p className="font-semibold">{activeOrder.pharmacyId?.name || 'Pharmacy'}</p>
                    <p className="text-sm text-muted-foreground">{activeOrder.pharmacyId?.city || 'City'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Destination</p>
                    <p className="font-semibold">{activeOrder.customerName || activeOrder.customerEmail?.split('@')[0] || 'Customer'}</p>
                    {activeOrder.destination && (
                      <p className="text-sm text-muted-foreground">
                        {typeof activeOrder.destination.lat === 'number'
                          ? `${activeOrder.destination.lat.toFixed(4)}, ${activeOrder.destination.lng.toFixed(4)}`
                          : 'Address pending'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-dashed border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Customer</p>
                    <p className="font-bold">{activeOrder.customerName || activeOrder.customerEmail?.split('@')[0] || 'Customer'}</p>
                  </div>
                </div>
                <Button size="icon" variant="secondary" className="rounded-full h-11 w-11 shadow-sm">
                  <Phone className="h-5 w-5" />
                </Button>
              </div>

              {/* Order Items */}
              {activeOrder.items && activeOrder.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Items ({activeOrder.items.length})</p>
                  <div className="space-y-2">
                    {activeOrder.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <span className="font-medium truncate">{it.medicine?.name || 'Medicine'}</span>
                        <span className="text-muted-foreground">×{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span><span className="text-[1.1em]">৳</span>{(activeOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="pt-2 space-y-3">
                {activeOrder.status === 'Driver Assigned' && (
                  <Button onClick={() => updateStatus('Picked Up')} className="w-full h-14 text-lg rounded-2xl shadow-glow bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                    <PackageCheck className="mr-2 h-5 w-5" /> I Have Picked Up
                  </Button>
                )}
                {activeOrder.status === 'Picked Up' && (
                  <Button onClick={() => updateStatus('On the Way')} className="w-full h-14 text-lg rounded-2xl shadow-glow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Navigation className="mr-2 h-5 w-5" /> Start Navigation
                  </Button>
                )}
                {activeOrder.status === 'On the Way' && (
                  <div className="space-y-3">
                    <Button onClick={() => updateStatus('Arrived')} className="w-full h-14 text-lg rounded-2xl bg-orange-500 hover:bg-orange-600">
                      <MapPin className="mr-2 h-5 w-5" /> I Have Arrived
                    </Button>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        <span className="text-sm font-bold text-primary-deep dark:text-primary">Dev Simulation Mode</span>
                      </div>
                      <Button
                        size="sm"
                        variant={isSimulating ? "destructive" : "default"}
                        onClick={toggleSimulation}
                        className="font-bold rounded-lg"
                      >
                        {isSimulating ? "Stop Simulation" : "Simulate Journey"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeOrder.status === 'Arrived' && (
                  <div className="space-y-4 p-5 border-2 border-orange-500/20 bg-orange-500/5 rounded-2xl">
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="font-bold text-orange-600">Enter Customer OTP</p>
                      <p className="text-xs text-muted-foreground">The customer received a 4-digit code</p>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="• • • •" 
                        maxLength={4} 
                        className="text-center text-2xl h-14 font-mono tracking-[0.5em] border-2"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <Button onClick={verifyOtp} className="h-14 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                        <CheckCircle2 className="mr-2" /> Verify
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Available / History Tabs */}
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setActiveTab('available')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'available'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="h-4 w-4 inline mr-2" />
                Available ({availableOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                History
              </button>
            </div>

            {activeTab === 'available' && (
              <div className="space-y-3">
                {!isOnline && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">You are currently offline. Go online to receive delivery requests.</p>
                  </div>
                )}

                {isOnline && availableOrders.map((order: any) => (
                  <Card key={order._id || order.id} className="p-5 group hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-display font-bold text-lg">
                            #{((order._id || order.id || '').slice(-6)).toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <span className="text-[1.1em] mr-0.5">৳</span>{(order.total || 0).toFixed(0)}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <CircleDot className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {order.pharmacyId?.name || 'Pharmacy'} · {order.pharmacyId?.city || 'City'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-accent flex-shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {order.customerName || order.customerEmail?.split('@')[0] || 'Customer'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleTimeString()}
                          <span className="text-emerald-600 font-semibold ml-1">+৳35 fee</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => acceptOrder(order._id || order.id)}
                        className="rounded-xl px-6 h-12 font-bold shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        Accept
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {isOnline && availableOrders.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-muted rounded-3xl">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground font-medium">No pending requests right now</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">New orders will appear here automatically</p>
                    <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={fetchData}>
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {completedOrders.map((order: any) => (
                  <Card key={order._id || order.id} className="p-5 border-border/60 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-bold text-lg">
                            #{(order._id || order.id || '').slice(-6).toUpperCase()}
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {order.pharmacyId?.name || 'Pharmacy'} → {order.customerName || order.customerEmail?.split('@')[0] || 'Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(order.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-lg text-emerald-600">+৳35</div>
                        <div className="text-xs text-muted-foreground">Total: ৳{(order.total || 0).toFixed(0)}</div>
                      </div>
                    </div>
                  </Card>
                ))}

                {completedOrders.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-muted rounded-3xl">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground font-medium">No completed deliveries yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Complete deliveries to build your history</p>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Quick Tips Card */}
        <Card className="p-5 bg-muted/30 border-border/50">
          <h4 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" /> Quick Tips
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              Accept an order and head to the pharmacy for pickup
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              Tap "Start Navigation" once you've collected the package
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              Press "I Have Arrived" at the customer's location
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              Enter the customer's 4-digit OTP to complete delivery & earn ৳35
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
