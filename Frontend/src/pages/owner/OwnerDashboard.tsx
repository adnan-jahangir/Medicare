import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/useAppStore';
import { Pill, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OwnerDashboard() {
  const { medicines, orders } = useAppStore();
  const myPharmacy = 'ph_1'; // demo
  const myMeds = useMemo(() => medicines.filter((m) => m.pharmacyId === myPharmacy), [medicines]);
  const myOrders = useMemo(() => orders.filter((o) => o.pharmacyId === myPharmacy), [orders]);
  const revenue = myOrders.reduce((s, o) => s + o.total, 0);
  const lowStock = myMeds.filter((m) => m.stock < 50);

  return (
    <DashboardLayout role="owner" title="Welcome back, Dr. Cole" subtitle="GreenLeaf Pharmacy · New York">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard icon={Pill} label="Your medicines" value={myMeds.length} tone="primary" />
            <StatCard icon={Package} label="Open orders" value={myOrders.filter((o) => o.status !== 'Delivered').length} tone="accent" />
            <StatCard icon={DollarSign} label="Total revenue" value={`$${revenue.toFixed(0)}`} tone="success" />
            <StatCard icon={AlertTriangle} label="Low stock SKUs" value={lowStock.length} tone="warning" />
          </div>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Inventory preview</h3>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost"><Link to="/owner/medicines">Manage</Link></Button>
                <Button size="sm">Add medicine</Button>
              </div>
            </div>
            <div className="space-y-2">
              {myMeds.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                  <img src={m.image} alt={m.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.strength} • {m.packaging}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{m.stock} pcs</div>
                    <div className="text-sm font-semibold">${m.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
              {myMeds.length === 0 && <p className="text-sm text-muted-foreground">No medicines registered yet.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-3">Orders breakdown</h3>
            <div className="space-y-2">
              {['Pending', 'Preparing', 'Out for Delivery', 'Delivered'].map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{s}</div>
                  <div className="font-semibold">{myOrders.filter((o) => o.status === s).length}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-3">Quick actions</h3>
            <div className="flex flex-col gap-2">
              <Button asChild><Link to="/owner/medicines">Manage medicines</Link></Button>
              <Button asChild variant="secondary"><Link to="/owner/orders">View orders</Link></Button>
              <Button variant="outline">Payouts</Button>
              <Button variant="outline">Update profile</Button>
            </div>
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}
