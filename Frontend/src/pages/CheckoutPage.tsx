import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote, Lock, Loader2, Phone, Mail, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { CheckoutMapPicker } from '@/components/CheckoutMapPicker';

export default function CheckoutPage() {
  const { cart, medicines, clearCart, user, pharmacies } = useAppStore();
  const items = cart.map((c) => ({ medicine: medicines.find((m) => m.id === c.medicineId)!, quantity: c.quantity })).filter((i) => i.medicine);
  const subtotal = items.reduce((s, i) => s + i.medicine.price * i.quantity, 0);
  const deliveryFee = subtotal >= 25 ? 0 : 3.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const zip = '';
  const [method, setMethod] = useState<'online' | 'cod'>('online');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number }>({ lat: 22.3624, lng: 91.8023 });
  const nav = useNavigate();

  if (items.length === 0) {
    nav('/cart');
    return null;
  }

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
    if (!address.trim()) errs.address = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors before checking out');
      return;
    }
    
    setProcessing(true);

    try {
      // Determine pharmacy
      const firstMedicine = items[0]?.medicine;
      const pharmacyId = (firstMedicine as any)?._id
        ? (firstMedicine as any).pharmacyId
        : firstMedicine?.pharmacyId;

      // 1. Prepare Order payload
      const orderPayload = {
        pharmacyId,
        items: items.map(i => ({
          medicine: (i.medicine as any)._id || i.medicine.id,
          quantity: i.quantity
        })),
        total,
        destination: customerCoords,
        deliveryAddress: customerCoords,
        address: `${address}, ${city} (ZIP: ${zip})`,
        customerName: name,
        customerPhone: phoneNumber,
        paymentMethod: method === 'online' ? 'Online Payment' : 'Cash on Delivery',
        paymentStatus: 'Pending',
        status: 'Pending'
      };

      // 2. Create order in Backend database
      const response = await api.post('/orders', orderPayload);

      if (response.data.success) {
        const createdOrder = response.data.data;
        const orderId = createdOrder._id || createdOrder.id;

        if (method === 'cod') {
          // Cash on Delivery - Complete immediately
          clearCart();
          toast.success('Order placed successfully!', { description: 'Please prepare cash upon delivery.' });
          nav(`/orders/${orderId}`);
        } else {
          // Online Payment (Aamarpay) - Initiate sandbox gateway redirect
          try {
            const paymentPayload = {
              orderId,
              amount: total,
              name,
              email,
              phone: phoneNumber,
              address,
              city,
              zip
            };

            const payResponse = await api.post('/payment/initiate', paymentPayload);

            if (payResponse.data.success && payResponse.data.url) {
              clearCart();
              toast.success('Redirecting to gateway...');
              // Redirect to Aamarpay Sandbox Gateway
              window.location.href = payResponse.data.url;
            } else {
              throw new Error(payResponse.data.message || 'Failed to initiate payment gateway');
            }
          } catch (payErr: any) {
            console.error('Payment initiation error:', payErr);
            toast.error(payErr.response?.data?.message || payErr.message || 'Payment initiation failed. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const message = error.response?.data?.message || 'Failed to place order. Please check inputs and stock.';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container py-10 max-w-6xl">
      <h1 className="font-display font-bold text-3xl md:text-4xl mb-8">Checkout</h1>

      <form onSubmit={handleCheckoutSubmit} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          
          {/* Delivery Address Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold mb-5 flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" /> Delivery address
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold">Full name</Label>
                <Input 
                  id="name" 
                  required 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }} 
                  className={`mt-1.5 focus-visible:ring-primary ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`} 
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }} 
                  className={`mt-1.5 focus-visible:ring-primary ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`} 
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold">Phone number</Label>
                <Input 
                  id="phoneNumber" 
                  type="tel" 
                  placeholder="e.g. +88017XXXXXXXX"
                  required 
                  value={phoneNumber} 
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                  }} 
                  className={`mt-1.5 focus-visible:ring-primary ${errors.phoneNumber ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`} 
                />
                {errors.phoneNumber && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phoneNumber}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold">Street address</Label>
                <Input 
                  id="address" 
                  required 
                  value={address} 
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                  }} 
                  placeholder="House 12, Road 4, Sector 3" 
                  className={`mt-1.5 focus-visible:ring-primary ${errors.address ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`} 
                />
                {errors.address && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.address}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                <Input 
                  id="city" 
                  required 
                  value={city} 
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                  }} 
                  className={`mt-1.5 focus-visible:ring-primary ${errors.city ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`} 
                />
                {errors.city && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.city}</p>}
              </div>

              <div className="sm:col-span-2 pt-2">
                <CheckoutMapPicker
                  initialCoords={customerCoords}
                  onChange={setCustomerCoords}
                  onAddressSelect={(fullAddr) => {
                    setAddress(fullAddr);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                />
              </div>
            </div>
          </section>

          {/* Refactored Payment Options Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold mb-5 flex items-center gap-2 text-lg">
              Payment Method
            </h3>
            
            <RadioGroup value={method} onValueChange={(val: any) => setMethod(val)} className="grid sm:grid-cols-2 gap-4">
              {[
                { 
                  id: 'online', 
                  label: 'Online Payment', 
                  description: 'Pay securely via bKash, Nagad, Visa, or Mastercard', 
                  icon: CreditCard,
                },
                { 
                  id: 'cod', 
                  label: 'Cash on Delivery (COD)', 
                  description: 'Pay with cash upon receiving your medicines', 
                  icon: Banknote 
                },
              ].map((opt) => (
                <Label
                  key={opt.id}
                  htmlFor={opt.id}
                  className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    method === opt.id 
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5" />
                      <div>
                        <span className="text-sm font-bold block">{opt.label}</span>
                        <span className="text-xs text-muted-foreground mt-1 block leading-normal">{opt.description}</span>
                      </div>
                    </div>
                    <opt.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  
                  {opt.id === 'online' && (
                    <div className="mt-4 flex gap-2 items-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mr-1">Supported:</span>
                      <span className="text-[9px] bg-pink-500/10 text-pink-600 px-1.5 py-0.5 rounded font-bold">bKash</span>
                      <span className="text-[9px] bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded font-bold">Nagad</span>
                      <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold">Cards</span>
                    </div>
                  )}
                </Label>
              ))}
            </RadioGroup>

            {method === 'online' && (
              <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-normal">
                  You will be redirected to our secure <strong>Aamarpay Sandbox Gateway</strong> to complete your payment.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display font-semibold mb-4 text-base">Your order</h3>
            <ul className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((i) => (
                <li key={i.medicine.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate pr-2">{i.medicine.name} × {i.quantity}</span>
                  <span className="tabular-nums font-medium"><span className="text-[1.1em]">৳</span>{(i.medicine.price * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-dashed border-border pt-4 flex justify-between items-baseline">
              <span className="font-display font-semibold text-sm">Total</span>
              <span className="font-display font-bold text-2xl tabular-nums"><span className="text-[1.1em]">৳</span>{total.toFixed(2)}</span>
            </div>
            
            <Button type="submit" size="lg" className="w-full mt-5 rounded-full h-12 text-sm font-bold shadow-md" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Processing…
                </>
              ) : method === 'cod' ? (
                'Confirm Order (COD)'
              ) : (
                `Pay Now ৳${total.toFixed(2)}`
              )}
            </Button>
            
            <p className="text-[10px] text-muted-foreground text-center mt-3 leading-normal">
              This is a sandbox integration environment. No real funds will be transferred.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
