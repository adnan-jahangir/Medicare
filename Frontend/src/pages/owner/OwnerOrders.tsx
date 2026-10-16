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
  ShoppingBag, Sparkles, Filter, CheckCircle2, ChevronRight, TrendingUp,
  DollarSign, ArrowUpRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

// Status badge styling map with clean, readable colors
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; dotColor: string }> = {
  'Pending':         { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'New Order', dotColor: 'bg-amber-500 animate-pulse' },
  'Confirmed':       { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Accepted', dotColor: 'bg-blue-500' },
  'Preparing':       { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'In Preparation', dotColor: 'bg-purple-500 animate-spin' },
  'Ready':           { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/35', label: 'Ready for Courier', dotColor: 'bg-emerald-500' },
  'Driver Assigned': { color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Courier Assigned', dotColor: 'bg-cyan-500' },
  'Picked Up':       { color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', label: 'Courier Picked Up', dotColor: 'bg-indigo-500' },
  'On the Way':      { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'In Transit', dotColor: 'bg-orange-500' },
  'Arrived':         { color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/30', label: 'Rider Arrived', dotColor: 'bg-teal-500' },
  'Delivered':       { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-500/15', border: 'border-green-500/35', label: 'Delivered', dotColor: 'bg-green-500' },
  'Completed':       { color: 'text-emerald-800 dark:text-emerald-200', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Completed', dotColor: 'bg-emerald-600' },
  'Cancelled':       { color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Cancelled', dotColor: 'bg-rose-500' },
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
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'transit' | 'completed' | 'all'>('pending');
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
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';
      socketRef.current = io(socketUrl, {
        auth: { token },
        timeout: 4000,
        reconnectionAttempts: 5,
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

      socketRef.current.on('order:completed', (data: any) => {
        toast.success(`🎉 Order #${(data.orderId || '').slice(-6).toUpperCase()} delivered! +৳${data.profit || '0'} net profit.`);
        fetchOrders();
      });
    } catch (err) {
      console.warn('Socket connection error:', err);
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
    // Optimistic UI Update
    setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status } : o));
    toast.success(`Order #${(orderId).slice(-6).toUpperCase()} updated to '${status}'`);
    
    try {
      setUpdatingId(orderId);
      await api.patch(`/orders/${orderId}`, { status });
    } catch (err: any) {
      fetchOrders();
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    // Optimistic UI Update
    setOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));
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

  // Counts & financial metrics
  const counts = useMemo(() => {
    const completedList = orders.filter(o => ['Delivered', 'Completed'].includes(o.status));
    const completedTotal = completedList.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const estProfit = Math.round(completedTotal * 0.20 * 100) / 100;

    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      preparing: orders.filter(o => ['Confirmed', 'Preparing'].includes(o.status)).length,
      transit: orders.filter(o => ['Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(o.status)).length,
      completed: orders.filter(o => ['Delivered', 'Completed', 'Cancelled'].includes(o.status)).length,
      fulfilledCount: completedList.length,
      estProfit,
      completedTotal,
    };
  }, [orders]);

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Pharmacy Orders" subtitle="Live order stream">
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

        {/* Top 4 Summary Cards (Clickable & Spacious) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* 1. New Orders */}
          <div 
            onClick={() => setActiveTab('pending')}
            className={`p-5 rounded-2xl border bg-card shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'pending'
                ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'border-border/80 hover:border-amber-500/50 hover:shadow-xs'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">New Orders</div>
              <div className="text-3xl font-display font-black text-foreground">
                {counts.pending}
              </div>
              <span className={`text-[11px] font-bold ${counts.pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {counts.pending > 0 ? 'Action required' : 'No pending orders'}
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Bell className={`h-6 w-6 ${counts.pending > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* 2. Preparing */}
          <div 
            onClick={() => setActiveTab('preparing')}
            className={`p-5 rounded-2xl border bg-card shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'preparing'
                ? 'border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'border-border/80 hover:border-purple-500/50 hover:shadow-xs'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Preparing</div>
              <div className="text-3xl font-display font-black text-foreground">
                {counts.preparing}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                In prescription packaging
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <ChefHat className="h-6 w-6" />
            </div>
          </div>

          {/* 3. In Transit */}
          <div 
            onClick={() => setActiveTab('transit')}
            className={`p-5 rounded-2xl border bg-card shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'transit'
                ? 'border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                : 'border-border/80 hover:border-cyan-500/50 hover:shadow-xs'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">In Transit</div>
              <div className="text-3xl font-display font-black text-foreground">
                {counts.transit}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Couriers en route
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6" />
            </div>
          </div>

          {/* 4. Fulfilled & Realized Profit */}
          <div 
            onClick={() => setActiveTab('completed')}
            className={`p-5 rounded-2xl border bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'completed'
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-xs'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Fulfilled</span>
                <span className="text-[10px] bg-emerald-500/15 px-1.5 py-0.2 rounded font-mono font-bold">+20% Profit</span>
              </div>
              <div className="text-3xl font-display font-black text-emerald-600">
                {counts.fulfilledCount}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                Net Profit: <strong className="text-emerald-600 font-mono">৳{counts.estProfit.toFixed(1)}</strong>
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-2.5 rounded-2xl border border-border/80 shadow-2xs">
          
          {/* Tabs: New Orders first */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-0.5">
            {[
              { id: 'pending', label: 'New Orders', count: counts.pending, alert: counts.pending > 0 },
              { id: 'preparing', label: 'Preparing', count: counts.preparing },
              { id: 'transit', label: 'In Transit', count: counts.transit },
              { id: 'completed', label: 'History', count: counts.completed },
              { id: 'all', label: 'All Orders', count: counts.all },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
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
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer, phone…"
              className="pl-9 pr-8 h-10 rounded-xl bg-background text-xs sm:text-sm border-border/80 focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Orders List (Spacious & Clean Cards) */}
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const config = STATUS_CONFIG[o.status] || STATUS_CONFIG['Pending'];
            const action = PHARMACY_ACTIONS[o.status];
            const isUpdating = updatingId === (o._id || o.id);
            const canCancel = ['Pending', 'Confirmed', 'Preparing'].includes(o.status);
            const isCompleted = ['Delivered', 'Completed'].includes(o.status);
            const profitVal = Math.round((o.total || 0) * 0.20 * 100) / 100;

            return (
              <Card
                key={o._id || o.id}
                className="p-6 hover:shadow-md transition-all duration-200 border-border/70 bg-card rounded-2xl relative overflow-hidden group space-y-5"
              >
                {/* Status bar accent top line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.bg.replace('/10', '/40').replace('/20', '/60')}`} />

                {/* Top Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary font-mono font-black flex items-center justify-center text-sm shadow-2xs">
                      #
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-display font-black text-lg tracking-tight text-foreground">
                          {(o._id || o.id || '').slice(-6).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg} ${config.border} border`}>
                          <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                          {config.label}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <TrendingUp className="h-3 w-3 text-emerald-600" /> +৳{profitVal.toFixed(1)} Profit
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1.5 flex-wrap">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{new Date(o.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {o.paymentMethod || 'Cash on Delivery'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Total Order Value */}
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Order Value</div>
                    <div className="font-display font-black text-2xl sm:text-3xl text-foreground tabular-nums">
                      <span className="text-[0.9em] text-primary mr-0.5">৳</span>{(o.total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Middle Info Section: Customer Details & Items Side by Side */}
                <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
                  
                  {/* Left Column: Customer & Address Details */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2.5">
                    <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span>{o.customerName || o.customerEmail?.split('@')[0] || 'Customer'}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1.5">
                      {o.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a href={`tel:${o.customerPhone}`} className="font-mono text-foreground font-semibold hover:text-primary hover:underline">
                            {o.customerPhone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{o.customerEmail}</span>
                      </div>
                      {o.customerAddress && (
                        <div className="flex items-start gap-2 pt-2 border-t border-border/50 text-foreground">
                          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed font-medium">{o.customerAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Prescribed Medicine Items (Full Images & Quantities) */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Prescribed Items ({o.items?.length || 0})</span>
                      <span className="text-[11px] text-muted-foreground font-normal">Medicine stock verified</span>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(o.items || []).map((it: any, idx: number) => {
                        const med = it.medicine || {};
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/60 text-xs hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={getMedicineImageUrl(med)}
                                alt={med.name || 'Medicine'}
                                onError={(e) => handleMedicineImgError(e, med)}
                                className="h-9 w-9 rounded-lg object-cover bg-muted flex-shrink-0 border border-border/60"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-foreground truncate">{med.name || 'Medicine Item'}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{med.strength || med.brand || 'Rx Item'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                                ×{it.quantity}
                              </span>
                              <span className="font-bold text-sm text-foreground">
                                ৳{((med.price || 0) * (it.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Driver / Dispatch Logistics Banner (if ready or in-transit) */}
                {['Ready', 'Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(o.status) && (
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200">
                          {o.driverId ? `Assigned Courier: ${o.driverId.name || 'Courier Rider'}` : 'Awaiting Courier Acceptance'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {o.driverId ? `${o.driverId.phoneNumber || ''} ${o.driverId.vehicleType ? `• ${o.driverId.vehicleType}` : ''}` : 'Order broadcasted to nearby verified riders…'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold">
                      {config.label}
                    </Badge>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                  {action && (
                    <Button
                      onClick={() => handleStatusChange(o._id || o.id, action.nextStatus)}
                      disabled={isUpdating}
                      className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${action.className}`}
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
                      className="h-12 px-5 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/50 text-sm font-semibold"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Cancel Order
                    </Button>
                  )}

                  <Button asChild variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-border/70 hover:bg-muted" title="View Customer Live Tracking">
                    <a href={`/orders/${o._id || o.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </Button>
                </div>

              </Card>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-16 text-center border-2 border-dashed border-border/70 rounded-3xl space-y-3 bg-card/40">
              <div className="h-14 w-14 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">No orders in this view</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? `No orders matched "${searchQuery}"` : `There are currently no orders under the "${activeTab}" filter. New incoming orders will appear in real-time.`}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="rounded-xl mt-2">
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
