import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Package, Loader2 } from 'lucide-react';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-warning/15 text-warning-foreground border-warning/30',
  Confirmed: 'bg-primary/10 text-primary border-primary/30',
  Preparing: 'bg-accent/10 text-accent border-accent/30',
  Ready: 'bg-secondary text-secondary-foreground',
  'Picked Up': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'On the Way': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  Delivered: 'bg-success/15 text-success border-success/30',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="font-display font-bold text-2xl mt-4">No orders yet</h2>
        <Button asChild className="mt-5 rounded-full"><Link to="/medicines">Start shopping</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">My orders</h1>
      <p className="text-muted-foreground mb-8">{orders.length} total</p>

      <div className="space-y-3">
        {orders.map((o: any) => (
          <Link
            key={o._id}
            to={`/orders/${o._id}`}
            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-card transition-all"
          >
            <div className="flex -space-x-3">
              {(o.items || []).slice(0, 3).map((it: any, idx: number) => {
                const med = it.medicine;
                if (!med) return null;
                return (
                  <img
                    key={med._id || med.id || idx}
                    src={getMedicineImageUrl(med)}
                    alt={med.name || 'Medicine'}
                    onError={(e) => handleMedicineImgError(e, med)}
                    className="h-12 w-12 rounded-xl object-cover border-2 border-card"
                  />
                );
              })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">#{(o._id || '').slice(-6).toUpperCase()}</span>
                <Badge className={`border ${STATUS_COLORS[o.status] || 'bg-muted text-muted-foreground'}`}>{o.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {(o.items || []).length} item{(o.items || []).length !== 1 && 's'} · {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold tabular-nums"><span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(2)}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
