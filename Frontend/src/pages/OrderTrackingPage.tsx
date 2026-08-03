import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { OrderTimeline } from '@/components/OrderTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Truck, Phone, Star, MapPin, ChevronDown, ChevronUp, ShoppingBag, Loader2 } from 'lucide-react';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-load the new LiveOrderMap (it pulls in Leaflet which is large)
import { lazy, Suspense } from 'react';
const LiveOrderMap = lazy(() =>
  import('@/components/LiveOrderMap').then((m) => ({ default: m.LiveOrderMap }))
);

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { orders, updateOrderStatus } = useAppStore();
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArrivingBanner, setShowArrivingBanner] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // First try finding the order in local store
  const localOrder = orders.find((o) => o.id === id || (o as any)._id === id);
  const order = orderDetails || localOrder || null;

  // Normalize coords helper
  const getCoords = (c: any): { lat: number; lng: number } => {
    if (Array.isArray(c)) {
      return {
        lng: typeof c[0] === 'number' ? c[0] : 0,
        lat: typeof c[1] === 'number' ? c[1] : 0,
      };
    }
    if (c && typeof c === 'object') {
      return {
        lat: typeof c.lat === 'number' ? c.lat : 0,
        lng: typeof c.lng === 'number' ? c.lng : 0,
      };
    }
    return { lat: 0, lng: 0 };
  };

  const getDeliveryCoords = (o: any): { lat: number; lng: number } => {
    if (o?.deliveryAddress) {
      const coords = getCoords(o.deliveryAddress);
      if (coords.lat !== 0 || coords.lng !== 0) return coords;
    }
    const dest = getCoords(o?.destination);
    if (dest.lat !== 0 || dest.lng !== 0) return dest;
    return { lat: 22.3680, lng: 91.8020 }; // Customer fallback coords
  };

  const getPickupCoords = (o: any): { lat: number; lng: number } => {
    const pickup = getCoords(o?.pickup);
    if (pickup.lat !== 0 || pickup.lng !== 0) return pickup;
    return { lat: 22.3568, lng: 91.7832 }; // Pharmacy fallback coords
  };

  // Fetch full order details from backend
  const fetchOrder = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        // Normalize _id to id for items
        if (data.items) {
          data.items = data.items.map((it: any) => ({
            ...(it || {}),
            medicine: it?.medicine
              ? { ...it.medicine, id: it.medicine._id || it.medicine.id }
              : null,
          }));
        }
        setOrderDetails({
          ...data,
          id: data._id || data.id,
          driverProgress: data.driverProgress || 0,
          pickup: data.pickup || [0, 0],
          destination: data.destination || [0, 0],
          deliveryAddress: data.deliveryAddress || null,
          createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
        });
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      if (!localOrder) {
        setError('Order not found');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto re-fetch every 4 seconds while order is active to ensure instant driver assignment & status sync
    const interval = setInterval(() => {
      fetchOrder();
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading order details...</p>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{error || 'Order not found.'}</p>
        <Button asChild className="mt-4">
          <Link to="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const safeTotal = typeof order.total === 'number' ? order.total : 0;
  const pickupCoords = getPickupCoords(order);
  const deliveryCoords = getDeliveryCoords(order);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const orderId = order.id || (order as any)._id;
      setOrderDetails((prev: any) => prev ? { ...prev, status: 'Cancelled' } : null);
      await api.patch(`/orders/${orderId}`, { status: 'Cancelled' });
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
    }
  };

  const canCancel = order && ['Pending', 'Confirmed', 'Preparing'].includes(order.status);

  return (
    <div className="container py-10">
      {showArrivingBanner && (
        <div className="fixed top-0 left-0 w-full z-[100] bg-emerald-600 text-white py-3 px-6 shadow-lg animate-in slide-in-from-top duration-500 font-display font-bold text-center">
          🚚 Your rider is almost there!
        </div>
      )}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-3xl">#{(order.id || (order as any)._id || '').slice(-6).toUpperCase()}</h1>
            <Badge className="bg-primary/10 text-primary border-primary/30 border">
              {order.status}
            </Badge>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelOrder}
                className="rounded-full text-xs font-semibold text-red-600 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 h-8 px-3"
              >
                Cancel Order
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="font-display font-bold text-2xl">
            <span className="text-[1.1em]">৳</span>
            {safeTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card mb-6">
        <h3 className="font-display font-semibold mb-6">Order progress</h3>
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Live delivery tracking</h3>
          </div>

          {/* ── New LiveOrderMap — handles its own socket connection ── */}
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="rounded-2xl border border-border bg-muted h-[420px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <LiveOrderMap
                orderId={order.id || (order as any)._id}
                pharmacyLocation={pickupCoords}
                deliveryLocation={deliveryCoords}
                initialProgress={order.driverProgress || 0}
                initialStatus={order.status}
                className="h-[420px] w-full"
              />
            </Suspense>
          </ErrorBoundary>

          <p className="text-xs text-muted-foreground mt-2">
            {['Delivered', 'Completed'].includes(order.status)
              ? 'Delivery completed.'
              : ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived'].includes(order.status)
                ? 'Your courier is on the way.'
                : ['Ready'].includes(order.status)
                  ? 'Waiting for a courier to accept the delivery.'
                  : ['Confirmed', 'Preparing'].includes(order.status)
                    ? 'Your order is being prepared at the pharmacy.'
                    : 'Order placed successfully. Waiting for pharmacy confirmation.'}
          </p>

          {/* OTP Section for Customer */}
          {order.status === 'Arrived' && (
            <div className="mt-6 p-6 rounded-2xl border-2 border-orange-500/20 bg-orange-500/5 text-center animate-in fade-in zoom-in duration-300">
              <h4 className="font-bold text-orange-700 mb-1">Your rider has arrived!</h4>
              <p className="text-xs text-orange-600/80 mb-4">
                Provide this 4-digit PIN to receive your package
              </p>
              <div className="text-4xl font-mono tracking-[0.3em] font-black text-orange-600">
                {(order as any).otp || '••••'}
              </div>
            </div>
          )}

          {/* Driver Card */}
          {order.driverId && typeof order.driverId === 'object' &&
            ['Driver Assigned', 'Picked Up', 'On the Way', 'Arrived', 'Delivered', 'Completed'].includes(
              order.status
            ) && (
              <div className="mt-8 p-5 rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/10">
                    <AvatarImage src={order.driverId.profilePhoto} />
                    <AvatarFallback className="bg-primary/5 text-primary text-lg">
                      {(order.driverId.name || 'D').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-lg leading-tight">
                      {order.driverId.name || 'Assigned Courier'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        {order.driverId.rating || '5.0'}
                      </div>
                      <span className="text-muted-foreground text-xs">• Verified Courier</span>
                    </div>
                  </div>
                  {order.driverId.phoneNumber && (
                    <Button asChild size="icon" className="rounded-full h-12 w-12 shadow-md">
                      <a href={`tel:${order.driverId.phoneNumber}`}>
                        <Phone className="h-5 w-5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Delivery Address Section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Delivery Address
            </h3>
            <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-purple-500/10 flex items-center justify-center border border-border/50">
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #10b981 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm text-xs font-bold text-foreground z-10">
                <MapPin className="h-4 w-4 text-purple-600 animate-bounce" />
                <span>Customer Delivery Location</span>
              </div>
            </div>
            <div className="text-sm font-medium">Home</div>
            <div className="text-sm text-muted-foreground mt-1">
              123 Healthcare Avenue, Medical District
              <br />
              Central City, 10001
            </div>
          </div>

          {/* Collapsible Order Summary */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <h3 className="font-display font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> Order Summary
              </h3>
              {isSummaryOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isSummaryOpen ? 'max-height-none p-6 pt-0' : 'max-h-0'
              )}
            >
              <ul className="space-y-4 mb-6 border-t border-border pt-4">
                {(order.items || []).map((it: any, idx: number) => {
                  if (!it?.medicine) return null;
                  return (
                    <li
                      key={it.medicine.id || (it.medicine as any)._id || idx}
                      className="flex items-center gap-3"
                    >
                      <img
                        src={getMedicineImageUrl(it.medicine)}
                        alt={it.medicine.name}
                        onError={(e) => handleMedicineImgError(e, it.medicine)}
                        className="h-10 w-10 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-semibold text-sm truncate">
                          {it.medicine.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {it.medicine.strength} · Qty {it.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-medium tabular-nums">
                        <span className="text-[1.1em]">৳</span>
                        {((it.medicine.price || 0) * (it.quantity || 1)).toFixed(2)}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">
                    <span className="text-[1.1em]">৳</span>
                    {(safeTotal - 5).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="text-foreground font-medium">
                    <span className="text-[1.1em]">৳</span>5.00
                  </span>
                </div>
                <div className="flex justify-between text-lg font-display font-bold border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span>
                    <span className="text-[1.1em]">৳</span>
                    {safeTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
