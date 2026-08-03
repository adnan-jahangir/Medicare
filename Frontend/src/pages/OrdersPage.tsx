import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Package, Loader2, Clock, CheckCircle2, XCircle, ShoppingBag, Truck } from 'lucide-react';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Preparing: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  Ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'Driver Assigned': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  'Picked Up': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  'On the Way': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  Arrived: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
  Delivered: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
  Completed: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
  Cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled' | 'all'>('active');

  useEffect(() => {
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
    fetchOrders();
  }, []);

  const counts = useMemo(() => {
    return {
      active: orders.filter(o => !['Delivered', 'Completed', 'Cancelled'].includes(o.status)).length,
      completed: orders.filter(o => ['Delivered', 'Completed'].includes(o.status)).length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      all: orders.length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'active') return !['Delivered', 'Completed', 'Cancelled'].includes(o.status);
      if (activeTab === 'completed') return ['Delivered', 'Completed'].includes(o.status);
      if (activeTab === 'cancelled') return o.status === 'Cancelled';
      return true;
    });
  }, [orders, activeTab]);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-muted-foreground mt-4 font-medium text-sm">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-20 text-center max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="font-display font-bold text-2xl">No orders yet</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          You haven't placed any medicine orders yet. Explore our pharmacy catalog to order essentials.
        </p>
        <Button asChild className="mt-6 rounded-full h-11 px-8 font-bold shadow-md">
          <Link to="/medicines">
            <ShoppingBag className="mr-2 h-4 w-4" /> Start Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your active medicine deliveries and past purchases</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/80 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'active', label: 'Active Orders', count: counts.active, icon: Truck },
          { id: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle2 },
          { id: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle },
          { id: 'all', label: 'All Orders', count: counts.all, icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((o: any) => (
            <Link
              key={o._id || o.id}
              to={`/orders/${o._id || o.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex -space-x-3 flex-shrink-0">
                  {(o.items || []).slice(0, 3).map((it: any, idx: number) => {
                    const med = it.medicine;
                    if (!med) return null;
                    return (
                      <img
                        key={med._id || med.id || idx}
                        src={getMedicineImageUrl(med)}
                        alt={med.name || 'Medicine'}
                        onError={(e) => handleMedicineImgError(e, med)}
                        className="h-12 w-12 rounded-xl object-cover border-2 border-card shadow-sm"
                      />
                    );
                  })}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base text-foreground">
                      #{(o._id || o.id || '').slice(-6).toUpperCase()}
                    </span>
                    <Badge className={`border text-[11px] font-bold ${STATUS_COLORS[o.status] || 'bg-muted text-muted-foreground'}`}>
                      {o.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{new Date(o.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{(o.items || []).length} item{(o.items || []).length !== 1 && 's'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total</div>
                  <div className="font-display font-bold text-lg text-primary tabular-nums">
                    <span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(2)}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-border/60 rounded-3xl space-y-3 bg-card/40">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold text-lg">No orders in "{activeTab}"</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            You don't have any orders matching this filter tab.
          </p>
        </div>
      )}
    </div>
  );
}
