import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import {
  Pill, Package, DollarSign, AlertTriangle, Loader2, Building2,
  TrendingUp, Plus, ArrowRight, Clock, Sparkles, ShieldCheck,
  ShoppingBag, Store, CheckCircle2, ChevronRight, PackageCheck, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

export default function OwnerDashboard() {
  const { user } = useAppStore();
  const [statsData, setStatsData] = useState<any>(null);
  const [myMeds, setMyMeds] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchDashboardData();
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
        toast.info(`🔔 New order #${(data.orderId || '').slice(-6).toUpperCase()} received! ৳${data.total?.toFixed(0) || '0'}`);
        fetchDashboardData();
      });

      socketRef.current.on('order:completed', (data: any) => {
        toast.success(`🎉 Delivery completed! Order #${(data.orderId || '').slice(-6).toUpperCase()} delivered. +৳${data.profit || '0'} net profit credited!`);
        fetchDashboardData();
      });

      socketRef.current.on('order:statusChanged', () => {
        fetchDashboardData();
      });

      socketRef.current.on('dashboard:statsUpdated', () => {
        fetchDashboardData();
      });
    } catch (err) {
      console.warn('Socket connection warning:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [dashRes, medsRes] = await Promise.allSettled([
        api.get('/dashboard/owner'),
        api.get(`/medicines?pharmacyId=${user?.shopCode || ''}`)
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
        setStatsData(dashRes.value.data.data.stats);
        setRecentOrders(dashRes.value.data.data.recentOrders || []);
      }

      if (medsRes.status === 'fulfilled') {
        const list = Array.isArray(medsRes.value.data) ? medsRes.value.data : (medsRes.value.data?.data || []);
        setMyMeds(list);
      }
    } catch (err) {
      console.error('Owner dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const lowStock = myMeds.filter((m) => m.stock < 50);
  const title = user?.name ? `Welcome back, ${user.name}` : "Welcome back, Owner";
  const subtitle = user?.shopName ? `${user.shopName} · ${user.shopLocation || 'Chittagong, Bangladesh'}` : "Your Pharmacy";

  if (loading) {
    return (
      <DashboardLayout role="owner" title={title} subtitle={subtitle}>
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loading pharmacy analytics…</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = statsData || {
    totalMedicines: myMeds.length,
    pendingOrders: recentOrders.filter(o => !['Delivered', 'Completed', 'Cancelled'].includes(o.status)).length,
    deliveredOrders: recentOrders.filter(o => ['Delivered', 'Completed'].includes(o.status)).length,
    completedRevenue: 0,
    totalRevenue: 0,
    netProfit: 0,
    walletBalance: 0,
  };

  return (
    <DashboardLayout role="owner" title={title} subtitle={subtitle}>
      <div className="space-y-6">

        {/* Hero Pharmacy Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold tracking-wide">
                <Store className="h-3.5 w-3.5 text-emerald-300" />
                <span>{user?.shopName || 'MedeCare Partner Pharmacy'}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" />
              </div>
              <h1 className="font-display font-black text-2xl md:text-3xl text-balance">
                Store Dashboard & Financial Overview
              </h1>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Live metrics for prescriptions, medicine deliveries, and net pharmacy profit margin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild size="default" className="rounded-xl font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-md border-0">
                <Link to="/owner/orders">
                  <ShoppingBag className="mr-1.5 h-4 w-4 text-emerald-600" /> Orders ({stats.pendingOrders || 0})
                </Link>
              </Button>
              <Button asChild size="default" className="rounded-xl font-bold bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-400/30">
                <Link to="/owner/medicines">
                  <Plus className="mr-1.5 h-4 w-4 text-emerald-300" /> Add Medicine
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 5 Financial & Operational Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* 1. Net Profit Card (Prominent & Realized) */}
          <Card className="p-4 border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/10 hover:shadow-md transition-all rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Profit</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display font-black text-2xl text-emerald-600 tabular-nums">
                <span className="text-[0.9em] mr-0.5">৳</span>{(stats.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-1.5 py-0">
                  20% Margin
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">Realized</span>
              </div>
            </div>
          </Card>

          {/* 2. Completed Sales Revenue */}
          <Card className="p-4 border-border/70 bg-gradient-to-br from-card via-card to-teal-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Completed Sales</span>
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display font-black text-2xl text-foreground tabular-nums">
                <span className="text-[0.9em] text-teal-600 mr-0.5">৳</span>{(stats.completedRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/30 text-[10px] font-bold px-1.5 py-0">
                  Delivered
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">Gross Volume</span>
              </div>
            </div>
          </Card>

          {/* 3. Successful Deliveries */}
          <Card className="p-4 border-border/70 bg-gradient-to-br from-card via-card to-cyan-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fulfilled Orders</span>
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                <PackageCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display font-black text-2xl text-foreground tabular-nums">
                {stats.deliveredOrders || 0}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30 text-[10px] font-bold px-1.5 py-0">
                  OTP Verified
                </Badge>
                <span className="text-[10px] text-muted-foreground">Delivered</span>
              </div>
            </div>
          </Card>

          {/* 4. Pending Orders */}
          <Card className="p-4 border-border/70 bg-gradient-to-br from-card via-card to-amber-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Orders</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display font-black text-2xl text-foreground tabular-nums">
                {stats.pendingOrders || 0}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className={stats.pendingOrders > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold px-1.5 py-0" : "bg-muted text-muted-foreground text-[10px] px-1.5 py-0"}>
                  {stats.pendingOrders > 0 ? 'Awaiting Dispatch' : 'All Clear'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* 5. Active Medicines */}
          <Card className="p-4 border-border/70 bg-gradient-to-br from-card via-card to-blue-500/5 hover:shadow-md transition-all rounded-2xl col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active SKUs</span>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Pill className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display font-black text-2xl text-foreground tabular-nums">
                {stats.totalMedicines || 0}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className={lowStock.length > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold px-1.5 py-0" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold px-1.5 py-0"}>
                  {lowStock.length > 0 ? `${lowStock.length} Low stock` : 'Stock Healthy'}
                </Badge>
              </div>
            </div>
          </Card>

        </div>

        {/* Main Grid: Inventory & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inventory Preview Section */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Top Inventory Preview</h3>
                <p className="text-xs text-muted-foreground">Store catalog and stock level status</p>
              </div>
              <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-primary hover:bg-primary/10">
                <Link to="/owner/medicines">Manage Catalog ({myMeds.length})</Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {myMeds.slice(0, 6).map((m: any) => (
                <Card
                  key={m._id || m.id}
                  className="p-3 border-border/60 hover:shadow-xs transition-all rounded-xl flex items-center gap-3 bg-card"
                >
                  <img
                    src={getMedicineImageUrl(m)}
                    alt={m.name}
                    onError={(e) => handleMedicineImgError(e, m)}
                    className="h-11 w-11 rounded-lg object-cover bg-muted flex-shrink-0 border border-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-xs truncate text-foreground">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{m.brand} • {m.strength}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        m.stock === 0
                          ? 'bg-rose-500/10 text-rose-600'
                          : m.stock < 50
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {m.stock} in stock
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs text-foreground">
                      ৳{(m.price || 0).toFixed(0)}
                    </div>
                  </div>
                </Card>
              ))}

              {myMeds.length === 0 && (
                <div className="sm:col-span-2 p-8 text-center border border-dashed border-border/70 rounded-2xl">
                  <Pill className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1.5" />
                  <p className="text-xs font-medium text-muted-foreground">No medicines in your inventory</p>
                  <Button asChild size="sm" className="mt-2 rounded-xl text-xs">
                    <Link to="/owner/medicines">Add Medicine</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Recent Orders Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-foreground">Recent Orders</h3>
              <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-primary">
                <Link to="/owner/orders">View All</Link>
              </Button>
            </div>

            <div className="space-y-2.5">
              {recentOrders.slice(0, 5).map((o: any) => {
                const isCompleted = ['Delivered', 'Completed'].includes(o.status);
                const orderProfit = Math.round((o.total || 0) * 0.20 * 100) / 100;

                return (
                  <Card
                    key={o._id || o.id}
                    className="p-3.5 border-border/60 hover:shadow-xs transition-all rounded-xl bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs">
                            #{(o._id || o.id || '').slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isCompleted ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {o.customerName || 'Customer'}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-display font-black text-sm text-foreground">
                          ৳{(o.total || 0).toFixed(0)}
                        </div>
                        {isCompleted && (
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            +৳{orderProfit.toFixed(0)} profit
                          </div>
                        )}
                        <div>
                          <Button asChild size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] font-bold">
                            <Link to="/owner/orders">Manage <ChevronRight className="h-2.5 w-2.5 ml-0.5" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {recentOrders.length === 0 && (
                <div className="p-8 text-center border border-dashed border-border/70 rounded-xl text-muted-foreground text-xs">
                  No orders received yet. Live stream will show incoming orders automatically.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
