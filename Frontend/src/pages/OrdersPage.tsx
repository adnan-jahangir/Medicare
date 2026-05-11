import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-warning/15 text-warning-foreground border-warning/30',
  Confirmed: 'bg-primary/10 text-primary border-primary/30',
  Preparing: 'bg-accent/10 text-accent border-accent/30',
  Ready: 'bg-secondary text-secondary-foreground',
  Delivered: 'bg-success/15 text-success border-success/30',
};

export default function OrdersPage() {
  const { orders } = useAppStore();

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
        {orders.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-card transition-all"
          >
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it) => (
                <img key={it.medicine.id} src={it.medicine.image} alt={it.medicine.name} className="h-12 w-12 rounded-xl object-cover border-2 border-card" />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">{o.id}</span>
                <Badge className={`border ${STATUS_COLORS[o.status]}`}>{o.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {o.items.length} item{o.items.length !== 1 && 's'} · {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold tabular-nums">${o.total.toFixed(2)}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
