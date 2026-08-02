import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import {
  ShoppingBag, Heart, MapPin, Truck, UserCheck, Search, FileText,
  Clock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import api from '@/lib/api';

export default function CustomerDashboardPage() {
  const { cart, wishlist, orders: storeOrders, user } = useAppStore();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        if (res.data.success && Array.isArray(res.data.data)) {
          setFetchedOrders(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard orders:', err);
      }
    };
    fetchOrders();
  }, []);

  const allOrders = fetchedOrders.length > 0 ? fetchedOrders : storeOrders;
  const activeOrders = allOrders.filter((order: any) => !['Delivered', 'Completed', 'Cancelled'].includes(order.status));
  const latestOrder = allOrders[0];

  const title = `Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}!`;
  const subtitle = "Your medicine orders, prescription status, and live delivery updates";

  return (
    <DashboardLayout role="customer" title={title} subtitle={subtitle}>
      <div className="space-y-8">
        
        {/* Customer Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                <span>Fast 30-Min Medicine Delivery</span>
              </div>
              <h1 className="font-display font-black text-2xl md:text-4xl">
                Need Healthcare Essentials?
              </h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Order genuine prescribed medicines, OTC drugs, and health supplies directly to your doorstep in Chittagong.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-2xl font-bold bg-white text-teal-900 hover:bg-teal-50 shadow-lg border-0">
                <Link to="/medicines">
                  <ShoppingBag className="mr-2 h-4 w-4 text-teal-600" /> Order Medicine
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-2xl font-bold bg-teal-950/80 hover:bg-teal-950 text-white border border-teal-300/30 shadow-md">
                <Link to="/prescription">
                  <FileText className="mr-1.5 h-4 w-4 text-teal-300" /> Upload Prescription
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cart Items</span>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-rose-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wishlist</span>
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {wishlist.length}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-cyan-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Deliveries</span>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Truck className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {activeOrders.length}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</span>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-bold text-sm text-foreground truncate">
              {(user?.houseLocation || user?.shopLocation || (user as any)?.address) ? 'Saved' : 'Not Set'}
            </div>
          </Card>

        </div>

        {/* Quick Actions & Latest Order Tracker */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Quick Actions */}
          <Card className="p-6 border-border/60 rounded-2xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground">Quick Actions</h3>
              <Badge variant="outline" className="text-[10px] font-bold">Fast Services</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="rounded-xl h-12 justify-start font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/medicines">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Browse Medicines
                </Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-xl h-12 justify-start font-semibold">
                <Link to="/orders">
                  <Truck className="mr-2 h-4 w-4" /> View My Orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-12 justify-start font-semibold">
                <Link to="/wishlist">
                  <Heart className="mr-2 h-4 w-4 text-rose-500" /> Saved Wishlist
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-12 justify-start font-semibold">
                <Link to="/prescription">
                  <FileText className="mr-2 h-4 w-4 text-purple-500" /> Rx Prescription
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setProfileDialogOpen(true)}
                className="rounded-xl h-12 justify-start sm:col-span-2 border-primary/40 text-primary hover:bg-primary/10 font-bold"
              >
                <UserCheck className="mr-2 h-4 w-4" /> Edit Profile & Address
              </Button>
            </div>
          </Card>

          {/* Latest Order Card */}
          <Card className="p-6 border-border/60 rounded-2xl bg-card flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-foreground">Latest Order Activity</h3>
                {latestOrder && (
                  <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-primary">
                    <Link to={`/orders/${latestOrder.id}`}>Track Order <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
                  </Button>
                )}
              </div>

              {latestOrder ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Order ID</div>
                      <div className="font-display font-bold text-base">#{((latestOrder.id || latestOrder._id) || '').slice(-6).toUpperCase()}</div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-bold px-3 py-1">
                      {latestOrder.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">Total Price</span>
                    <span className="font-display font-bold text-primary"><span className="text-[1.1em]">৳</span>{latestOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-muted rounded-xl space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No orders placed yet. Explore our medicine catalog to order.</p>
                </div>
              )}
            </div>

            {latestOrder && (
              <Button asChild className="w-full mt-4 rounded-xl font-bold bg-primary hover:bg-primary/90">
                <Link to={`/orders/${latestOrder.id || latestOrder._id}`}>
                  <Truck className="mr-2 h-4 w-4" /> Track Live Order
                </Link>
              </Button>
            )}
          </Card>

        </div>

        <EditProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      </div>
    </DashboardLayout>
  );
}