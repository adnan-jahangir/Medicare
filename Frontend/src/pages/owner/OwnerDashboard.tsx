import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import {
  Pill, Package, DollarSign, AlertTriangle, Loader2, Building2,
  TrendingUp, Plus, ArrowRight, Clock, Sparkles, ShieldCheck,
  ShoppingBag, Store, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

export default function OwnerDashboard() {
  const { user } = useAppStore();
  const [statsData, setStatsData] = useState<any>(null);
  const [myMeds, setMyMeds] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading pharmacy analytics…</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = statsData || {
    totalMedicines: myMeds.length,
    pendingOrders: recentOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled').length,
    totalRevenue: 0,
  };

  return (
    <DashboardLayout role="owner" title={title} subtitle={subtitle}>
      <div className="space-y-8">

        {/* Hero Pharmacy Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold tracking-wide">
                <Store className="h-3.5 w-3.5 text-emerald-300" />
                <span>{user?.shopName || 'MedeCare Partner Pharmacy'}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" />
              </div>
              <h1 className="font-display font-black text-2xl md:text-4xl text-balance">
                Live Store Overview
              </h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Manage stock inventory, fulfill incoming customer prescriptions, and monitor sales in real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-2xl font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-lg border-0">
                <Link to="/owner/orders">
                  <ShoppingBag className="mr-2 h-4 w-4 text-emerald-600" /> Process Orders ({stats.pendingOrders || 0})
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-2xl font-bold bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-400/30 shadow-md">
                <Link to="/owner/medicines">
                  <Plus className="mr-1.5 h-4 w-4 text-emerald-300" /> Add Medicine
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Revenue Card */}
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/5 hover:border-emerald-500/40 hover:shadow-lg transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums">
                <span className="text-[1.1em] text-emerald-600">৳</span>{(stats.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                <TrendingUp className="h-3 w-3 mr-1" /> Live
              </Badge>
            </div>
          </Card>

          {/* Pending Orders Card */}
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 hover:border-amber-500/40 hover:shadow-lg transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Orders</span>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Package className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums">
                {stats.pendingOrders || 0}
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold">
                Awaiting
              </Badge>
            </div>
          </Card>

          {/* Total Medicines Card */}
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-blue-500/5 hover:border-blue-500/40 hover:shadow-lg transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active SKUs</span>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Pill className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums">
                {stats.totalMedicines}
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold">
                Catalog
              </Badge>
            </div>
          </Card>

          {/* Low Stock Card */}
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-red-500/5 hover:border-red-500/40 hover:shadow-lg transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alert</span>
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums">
                {lowStock.length}
              </div>
              <Badge variant="outline" className={lowStock.length > 0 ? "bg-red-500/10 text-red-600 border-red-500/30 text-[10px] font-bold" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold"}>
                {lowStock.length > 0 ? 'Restock Needed' : 'Good Stock'}
              </Badge>
            </div>
          </Card>

        </div>

        {/* Main Grid: Inventory & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inventory Preview Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Top Inventory Preview</h3>
                <p className="text-xs text-muted-foreground">Your store's active medicine catalog</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-primary hover:bg-primary/10">
                  <Link to="/owner/medicines">Manage Catalog ({myMeds.length})</Link>
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {myMeds.slice(0, 6).map((m: any) => (
                <Card
                  key={m._id || m.id}
                  className="p-4 border-border/60 hover:shadow-md hover:border-primary/40 transition-all rounded-2xl flex items-center gap-3 bg-card"
                >
                  <img
                    src={getMedicineImageUrl(m)}
                    alt={m.name}
                    onError={(e) => handleMedicineImgError(e, m)}
                    className="h-14 w-14 rounded-xl object-cover bg-muted flex-shrink-0 border border-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm truncate text-foreground">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{m.brand} • {m.strength}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.stock === 0
                          ? 'bg-red-500/10 text-red-600'
                          : m.stock < 50
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {m.stock} in stock
                      </span>
                      {m.prescriptionRequired && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600">
                          Rx
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-bold text-sm text-foreground">
                      <span className="text-[1.1em]">৳</span>{(m.price || 0).toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}

              {myMeds.length === 0 && (
                <div className="sm:col-span-2 p-10 text-center border-2 border-dashed border-muted rounded-2xl">
                  <Pill className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No medicines in your inventory</p>
                  <Button asChild size="sm" className="mt-3 rounded-full">
                    <Link to="/owner/medicines">Add Medicine</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Recent Orders Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground">Recent Orders</h3>
              <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-primary">
                <Link to="/owner/orders">View All</Link>
              </Button>
            </div>

            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((o: any) => (
                <Card
                  key={o._id || o.id}
                  className="p-4 border-border/60 hover:shadow-md transition-all rounded-2xl bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm">
                          #{(o._id || o.id || '').slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {o.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {o.customerName || o.customerEmail?.split('@')[0] || 'Customer'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(o.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display font-bold text-base text-primary">
                        <span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(0)}
                      </div>
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px] font-bold mt-1">
                        <Link to="/owner/orders">Manage <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {recentOrders.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-xs">
                  No orders received yet. New orders will show here in real-time.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

