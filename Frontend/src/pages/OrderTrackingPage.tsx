import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { OrderTimeline } from '@/components/OrderTimeline';
import { LiveDeliveryMap } from '@/components/LiveDeliveryMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { orders, advanceDriver } = useAppStore();
  const order = orders.find((o) => o.id === id);

  // Simulate driver moving once "Ready" / "Delivered"
  useEffect(() => {
    if (!order || order.status !== 'Ready' || order.driverProgress >= 1) return;
    const interval = setInterval(() => {
      const cur = useAppStore.getState().orders.find((o) => o.id === order.id);
      if (!cur || cur.driverProgress >= 1) { clearInterval(interval); return; }
      advanceDriver(order.id, Math.min(1, cur.driverProgress + 0.04));
    }, 2000);
    return () => clearInterval(interval);
  }, [order?.status, order?.id, advanceDriver]);

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild className="mt-4"><Link to="/orders">Back to orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl">{order.id}</h1>
            <Badge className="bg-primary/10 text-primary border-primary/30 border">{order.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="font-display font-bold text-2xl">${order.total.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card mb-6">
        <h3 className="font-display font-semibold mb-6">Order progress</h3>
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <h3 className="font-display font-semibold mb-3">Live delivery tracking</h3>
          <LiveDeliveryMap pickup={order.pickup} destination={order.destination} progress={order.driverProgress} />
          <p className="text-xs text-muted-foreground mt-2">
            {order.status === 'Delivered' ? 'Delivery completed.' :
             order.status === 'Ready' ? 'Your courier is on the way.' :
             'Your order is being prepared at the pharmacy.'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-4">Items</h3>
          <ul className="space-y-3">
            {order.items.map((it) => (
              <li key={it.medicine.id} className="flex items-center gap-3">
                <img src={it.medicine.image} alt={it.medicine.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-sm truncate">{it.medicine.name}</div>
                  <div className="text-xs text-muted-foreground">{it.medicine.strength} · qty {it.quantity}</div>
                </div>
                <div className="text-sm tabular-nums">${(it.medicine.price * it.quantity).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
