import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ORDER_STAGES, type OrderStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function OwnerOrders() {
  const { orders, updateOrderStatus } = useAppStore();
  const myOrders = orders.filter((o) => o.pharmacyId === 'ph_1');

  return (
    <DashboardLayout role="owner" title="Orders" subtitle="Update order status to trigger live customer tracking">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {myOrders.map((o) => (
          <div key={o.id} className="p-5 border-b border-border last:border-b-0 grid md:grid-cols-[1fr_180px_180px_120px] gap-4 items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">{o.id}</span>
                <Badge variant="outline" className="text-xs">{o.items.length} item{o.items.length !== 1 && 's'}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{o.customerName} · {o.customerEmail}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="font-display font-bold text-lg tabular-nums">${o.total.toFixed(2)}</div>
            <Select value={o.status} onValueChange={(v) => { updateOrderStatus(o.id, v as OrderStatus); toast.success(`Order ${o.id} → ${v}`); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ORDER_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <a href={`/orders/${o.id}`} target="_blank" rel="noreferrer">View tracking</a>
            </Button>
          </div>
        ))}
        {myOrders.length === 0 && <div className="p-10 text-center text-muted-foreground">No orders yet.</div>}
      </div>
    </DashboardLayout>
  );
}
