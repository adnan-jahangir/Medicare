import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/useAppStore';
import { ShoppingBag, Heart, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerDashboardPage() {
  const { cart, wishlist, orders, user } = useAppStore();
  const activeOrders = orders.filter((order) => order.status !== 'Delivered');
  const latestOrder = orders[0];

  return (
    <DashboardLayout role="customer" title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Your orders and delivery updates at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Cart items" value={cart.reduce((sum, item) => sum + item.quantity, 0)} tone="primary" />
        <StatCard icon={Heart} label="Wishlist" value={wishlist.length} tone="accent" />
        <StatCard icon={Truck} label="Active orders" value={activeOrders.length} tone="success" />
        <StatCard icon={MapPin} label="Saved location" value={user?.houseLocation ? 'Set' : 'Pending'} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-4">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="rounded-xl h-12 justify-start">
              <Link to="/medicines">Browse medicines</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl h-12 justify-start">
              <Link to="/orders">View orders</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-12 justify-start">
              <Link to="/wishlist">Open wishlist</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-12 justify-start">
              <Link to="/prescription">Upload prescription</Link>
            </Button>
            <Button variant="outline" className="rounded-xl h-12 justify-start sm:col-span-2">
              Update profile
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Latest order</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to={latestOrder ? `/orders/${latestOrder.id}` : '/orders'}>Track</Link>
            </Button>
          </div>
          {latestOrder ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-display font-semibold text-lg">{latestOrder.id}</div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium">{latestOrder.status}</div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-display font-semibold text-lg">${latestOrder.total.toFixed(2)}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No orders yet. Start by browsing medicines.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}