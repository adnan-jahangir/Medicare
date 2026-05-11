import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/useAppStore';
import { Users, Building2, Pill, ShoppingBag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

const DEMO_USERS = [
  { id: 'u1', name: 'Jane Cooper', email: 'jane@example.com', role: 'customer', status: 'active' },
  { id: 'u2', name: 'Wade Warren', email: 'wade@example.com', role: 'customer', status: 'active' },
  { id: 'u3', name: 'Dr. Amelia Cole', email: 'amelia@greenleaf.com', role: 'owner', status: 'active' },
  { id: 'u4', name: 'Dr. Marcus Reyes', email: 'marcus@citymed.com', role: 'owner', status: 'active' },
  { id: 'u5', name: 'Esther Howard', email: 'esther@example.com', role: 'customer', status: 'suspended' },
];

export default function AdminOverview() {
  const { medicines, orders, pharmacies } = useAppStore();
  return (
    <DashboardLayout role="admin" title="Admin overview" subtitle="System-wide stats and management">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={DEMO_USERS.length} tone="primary" />
        <StatCard icon={Building2} label="Pharmacies" value={pharmacies.length} tone="accent" />
        <StatCard icon={Pill} label="Medicines" value={medicines.length} tone="success" />
        <StatCard icon={ShoppingBag} label="Total orders" value={orders.length} tone="warning" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 mt-6">
        <h3 className="font-display font-semibold mb-4">Recent activity</h3>
        <ul className="space-y-3">
          {orders.slice(0, 6).map((o) => (
            <li key={o.id} className="flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Order <span className="font-semibold text-foreground">{o.id}</span> by {o.customerName} — {o.status}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(o.updatedAt).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState(DEMO_USERS);
  return (
    <DashboardLayout role="admin" title="Users" subtitle="Manage all platform users">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-[1fr_120px_100px_60px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary font-bold text-sm">{u.name.charAt(0)}</span>
              <div>
                <div className="font-display font-semibold text-sm">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize w-fit">{u.role}</Badge>
            <Badge className={u.status === 'active' ? 'bg-success/15 text-success border border-success/30' : 'bg-destructive/10 text-destructive border border-destructive/30'}>{u.status}</Badge>
            <Button variant="ghost" size="icon" onClick={() => { setUsers(users.filter((x) => x.id !== u.id)); toast.success('User removed'); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminPharmacies() {
  const { pharmacies } = useAppStore();
  return (
    <DashboardLayout role="admin" title="Pharmacies" subtitle="Approved pharmacy partners">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pharmacies.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
              <Badge className="bg-success/15 text-success border border-success/30">Active</Badge>
            </div>
            <h3 className="font-display font-bold text-lg mt-4">{p.name}</h3>
            <div className="text-sm text-muted-foreground">{p.city} · ⭐ {p.rating}</div>
            <div className="mt-4 pt-4 border-t border-border text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{p.ownerName}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Monthly</span><span className="font-medium tabular-nums">${p.monthlyRevenue.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminMedicines() {
  const { medicines, pharmacies, deleteMedicine } = useAppStore();
  return (
    <DashboardLayout role="admin" title="All medicines" subtitle="Across all pharmacies">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {medicines.map((m) => {
          const ph = pharmacies.find((p) => p.id === m.pharmacyId);
          return (
            <div key={m.id} className="grid grid-cols-[1fr_140px_100px_80px_60px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <img src={m.image} alt={m.name} className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0"><div className="font-display font-semibold truncate">{m.name}</div><div className="text-xs text-muted-foreground">{m.strength}</div></div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{ph?.name}</div>
              <div className="text-right tabular-nums">${m.price.toFixed(2)}</div>
              <div className="text-right tabular-nums">{m.stock}</div>
              <Button variant="ghost" size="icon" onClick={() => { deleteMedicine(m.id); toast.success('Removed'); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminOrders() {
  const { orders, pharmacies } = useAppStore();
  return (
    <DashboardLayout role="admin" title="All orders" subtitle="Platform-wide order log">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {orders.map((o) => {
          const ph = pharmacies.find((p) => p.id === o.pharmacyId);
          return (
            <div key={o.id} className="grid grid-cols-[1fr_140px_120px_100px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
              <div>
                <div className="font-display font-semibold text-sm">{o.id}</div>
                <div className="text-xs text-muted-foreground">{o.customerName}</div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{ph?.name}</div>
              <Badge variant="outline">{o.status}</Badge>
              <div className="text-right font-display font-bold tabular-nums">${o.total.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
