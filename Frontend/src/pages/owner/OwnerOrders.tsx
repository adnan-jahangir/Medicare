import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type OrderStatus } from '@/lib/types';
import {
  Loader2, CheckCircle, ChefHat, PackageCheck, Clock, Bell, XCircle,
  Truck, ExternalLink, Search, User, Phone, Mail, MapPin, CreditCard,
  ShoppingBag, Sparkles, Filter, CheckCircle2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

// Modernized Status badge styling map
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; dotColor: string }> = {
  'Pending':         { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Awaiting Action', dotColor: 'bg-amber-500 animate-pulse' },
  'Confirmed':       { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Accepted', dotColor: 'bg-blue-500' },
  'Preparing':       { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'In Kitchen/Rx Lab', dotColor: 'bg-purple-500 animate-spin' },
  'Ready':           { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Ready for Courier', dotColor: 'bg-emerald-500' },
  'Driver Assigned': { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Courier Assigned', dotColor: 'bg-cyan-500' },
  'Picked Up':       { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', label: 'Courier Picked Up', dotColor: 'bg-indigo-500' },
  'On the Way':      { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'In Transit', dotColor: 'bg-orange-500' },
  'Arrived':         { color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', label: 'Rider Arrived', dotColor: 'bg-teal-500' },
  'Delivered':       { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Delivered', dotColor: 'bg-green-500' },
  'Completed':       { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Completed', dotColor: 'bg-emerald-600' },
  'Cancelled':       { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Cancelled', dotColor: 'bg-red-500' },
};

// Which action button to show for each status the pharmacy can act on
const PHARMACY_ACTIONS: Record<string, { nextStatus: OrderStatus; label: string; icon: any; className: string }> = {
  'Pending': {
    nextStatus: 'Confirmed',
    label: 'Accept Order',
    icon: CheckCircle,
    className: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20',
  },
  'Confirmed': {
    nextStatus: 'Preparing',
    label: 'Start Preparing',
    icon: ChefHat,
    className: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md shadow-purple-500/20',
  },
  'Preparing': {
    nextStatus: 'Ready',
    label: 'Mark Ready for Courier',
    icon: PackageCheck,
    className: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
  },
};

export default function OwnerOrders() {
  const { user } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'transit' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchOrders();
    connectSocket();
    return () => {
      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch {}
      }
    };
  }, []);

  const connectSocket = () => {
    try {
      const { io } = require('socket.io-client');
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://medicare-rv55.onrender.com';
      socketRef.current = io(socketUrl, {
        auth: { token },
        timeout: 3000,
        reconnectionAttempts: 3,
      });

      socketRef.current.on('connect', () => {
        if (user?.shopCode) {
          socketRef.current.emit('pharmacy:joinDashboard', { pharmacyId: user.shopCode });
        }
      });

      socketRef.current.on('order:newOrder', (data: any) => {
        toast.info(`🔔 New order #${(data.orderId || '').slice(-6).toUpperCase()} received! ৳${data.total?.toFixed(0) || '0'}`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => setActiveTab('pending'),
          },
        });
        fetchOrders();
      });

      socketRef.current.on('order:statusChanged', (data: any) => {
        if (data.orderId) {
          setOrders(prev => prev.map(o =>
            (o._id === data.orderId || o.id === data.orderId)
              ? { ...o, status: data.status }
              : o
          ));
        }
      });
    } catch {
      // socket client fallback
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const rawOrders = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setOrders(rawOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    // Optimistic UI Update: update UI state instantly (0ms) without waiting for network call
    setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status } : o));
    toast.success(`Order #${(orderId).slice(-6).toUpperCase()} updated to '${status}'`);
    
    try {
      setUpdatingId(orderId);
      await api.patch(`/orders/${orderId}`, { status });
    } catch (err: any) {
      // Revert / refresh state on failure
      fetchOrders();
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    // Optimistic UI Update
    setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: 'Cancelled' } : o));
    toast.success('Order cancelled');

    try {
      setUpdatingId(orderId);
      await api.patch(`/orders/${orderId}`, { status: 'Cancelled' });
    } catch (err: any) {
      fetchOrders();
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (activeTab === 'pending' && o.status !== 'Pending') return false;
      if (activeTab === 'preparing' && !['Confirmed', 'Preparing'].includes(o.status)) return false;
      if (activeTab === 'transit' && !['Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(o.status)) return false;
      if (activeTab === 'completed' && !['Delivered', 'Completed', 'Cancelled'].includes(o.status)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (o._id || o.id || '').toLowerCase().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        const emailMatch = (o.customerEmail || '').toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || '').includes(q);
        return idMatch || nameMatch || emailMatch || phoneMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      preparing: orders.filter(o => ['Confirmed', 'Preparing'].includes(o.status)).length,
      transit: orders.filter(o => ['Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(o.status)).length,
      completed: orders.filter(o => ['Delivered', 'Completed', 'Cancelled'].includes(o.status)).length,
    };
  }, [orders]);

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Pharmacy Orders" subtitle="Live order processing hub">
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Connecting to live pharmacy stream…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner" title="Pharmacy Orders" subtitle="Manage incoming prescriptions and live customer dispatch">
      <div className="space-y-6">

        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">New Orders</div>
              <div className="text-2xl font-bold font-display">{counts.pending}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Preparing</div>
              <div className="text-2xl font-bold font-display">{counts.preparing}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">In Transit</div>
              <div className="text-2xl font-bold font-display">{counts.transit}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Fulfilled</div>
              <div className="text-2xl font-bold font-display">{counts.completed}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-2 rounded-2xl border border-border">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'New', count: counts.pending, alert: counts.pending > 0 },
              { id: 'preparing', label: 'Preparing', count: counts.preparing },
              { id: 'transit', label: 'In Transit', count: counts.transit },
              { id: 'completed', label: 'History', count: counts.completed },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : tab.alert
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, customer, phone…"
              className="pl-9 h-10 rounded-xl bg-background text-xs border-border/80"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const config = STATUS_CONFIG[o.status] || STATUS_CONFIG['Pending'];
            const action = PHARMACY_ACTIONS[o.status];
            const isUpdating = updatingId === (o._id || o.id);
            const canCancel = ['Pending', 'Confirmed', 'Preparing'].includes(o.status);

            return (
              <Card
                key={o._id || o.id}
                className="p-6 hover:shadow-lg transition-all duration-300 border-border/70 bg-gradient-to-br from-card via-card to-muted/20 rounded-2xl relative overflow-hidden group"
              >
                {/* Status bar accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${config.bg.replace('bg-', 'bg-')}`} />

                <div className="space-y-5">
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-sm shadow-inner">
                        #
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-lg">
                            {(o._id || o.id || '').slice(-6).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg} ${config.border} border`}>
                            <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                            {config.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(o.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span className="font-medium text-foreground">{o.paymentMethod || 'Cash on Delivery'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Order Value</div>
                        <div className="font-display font-bold text-2xl text-primary tabular-nums">
                          <span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Info Section: Customer Details & Items */}
                  <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
                    
                    {/* Customer & Address Details */}
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2.5">
                      <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
                        <User className="h-4 w-4 text-primary" />
                        {o.customerName || o.customerEmail?.split('@')[0] || 'Customer'}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {o.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{o.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{o.customerEmail}</span>
                        </div>
                        {o.customerAddress && (
                          <div className="flex items-start gap-2 pt-1 border-t border-border/40 text-foreground/80">
                            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight line-clamp-2">{o.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Items Table / Badges */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Items ({o.items?.length || 0})</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Rx items verified</span>
                      </div>
                      
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {(o.items || []).map((it: any, idx: number) => {
                          const med = it.medicine || {};
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={getMedicineImageUrl(med)}
                                  alt={med.name || 'Medicine'}
                                  onError={(e) => handleMedicineImgError(e, med)}
                                  className="h-8 w-8 rounded-md object-cover bg-muted flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">{med.name || 'Medicine Item'}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{med.strength || med.brand || 'Rx Item'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 font-mono font-medium">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">×{it.quantity}</span>
                                <span>৳{((med.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Driver / Dispatch Section */}
                  {['Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(o.status) && (
                    <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                            {o.driverId ? `Rider: ${o.driverId.name || 'Assigned Courier'}` : 'Awaiting Courier Acceptance'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {o.driverId ? `${o.driverId.phoneNumber || ''} ${o.driverId.vehicleType ? `• ${o.driverId.vehicleType}` : ''}` : 'Broadcasting order to nearby drivers…'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-600 text-[10px] font-bold">
                        {config.label}
                      </Badge>
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    {action && (
                      <Button
                        onClick={() => handleStatusChange(o._id || o.id, action.nextStatus)}
                        disabled={isUpdating}
                        className={`flex-1 h-11 rounded-xl font-bold transition-all ${action.className}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <action.icon className="h-4 w-4 mr-2" />
                        )}
                        {action.label}
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(o._id || o.id)}
                        disabled={isUpdating}
                        className="h-11 px-4 rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50 font-semibold"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Cancel Order
                      </Button>
                    )}

                    <Button asChild variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-border/60 hover:bg-muted">
                      <a href={`/orders/${o._id || o.id}`} target="_blank" rel="noreferrer" title="Live Customer View">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </Button>
                  </div>

                </div>
              </Card>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-16 text-center border-2 border-dashed border-muted rounded-3xl space-y-3 bg-card/50">
              <div className="h-14 w-14 rounded-full bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">No orders found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? `No orders matched your search query "${searchQuery}"` : `There are currently no orders under the "${activeTab}" filter.`}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="rounded-full">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

