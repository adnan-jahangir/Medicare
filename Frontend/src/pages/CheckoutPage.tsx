import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Banknote, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, medicines, placeOrder, user } = useAppStore();
  const items = cart.map((c) => ({ medicine: medicines.find((m) => m.id === c.medicineId)!, quantity: c.quantity })).filter((i) => i.medicine);
  const subtotal = items.reduce((s, i) => s + i.medicine.price * i.quantity, 0);
  const total = subtotal + (subtotal >= 25 ? 0 : 3.99) + subtotal * 0.08;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New York');
  const [zip, setZip] = useState('');
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const nav = useNavigate();

  if (items.length === 0) {
    nav('/cart');
    return null;
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      const order = placeOrder(name, email);
      setProcessing(false);
      if (order) {
        toast.success('Payment successful!', { description: `Order ${order.id} placed.` });
        nav(`/orders/${order.id}`);
      }
    }, 1500);
  };

  return (
    <div className="container py-10">
      <h1 className="font-display font-bold text-3xl md:text-4xl mb-8">Checkout</h1>

      <form onSubmit={handlePay} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Delivery address</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Full name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label htmlFor="address">Street address</Label><Input id="address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Apt 4B" className="mt-1.5" /></div>
              <div><Label htmlFor="city">City</Label><Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="zip">ZIP</Label><Input id="zip" required value={zip} onChange={(e) => setZip(e.target.value)} className="mt-1.5" /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              Payment <span className="pill bg-muted text-muted-foreground"><Lock className="h-3 w-3" /> Demo</span>
            </h3>
            <RadioGroup value={method} onValueChange={setMethod} className="grid sm:grid-cols-3 gap-3">
              {[
                { id: 'card', label: 'Credit card', icon: CreditCard },
                { id: 'wallet', label: 'Digital wallet', icon: Wallet },
                { id: 'cod', label: 'Cash on delivery', icon: Banknote },
              ].map((opt) => (
                <Label
                  key={opt.id}
                  htmlFor={opt.id}
                  className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all ${method === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                  <opt.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>

            {method === 'card' && (
              <div className="grid sm:grid-cols-[1fr_100px_100px] gap-3 mt-5">
                <Input placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                <Input placeholder="MM/YY" defaultValue="12/29" />
                <Input placeholder="CVC" defaultValue="123" />
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display font-semibold mb-4">Your order</h3>
            <ul className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((i) => (
                <li key={i.medicine.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate pr-2">{i.medicine.name} × {i.quantity}</span>
                  <span className="tabular-nums">${(i.medicine.price * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-dashed border-border pt-4 flex justify-between items-baseline">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display font-bold text-2xl tabular-nums">${total.toFixed(2)}</span>
            </div>
            <Button type="submit" size="lg" className="w-full mt-5 rounded-full" disabled={processing}>
              {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : `Pay $${total.toFixed(2)}`}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              This is a demo. No real payment will be processed.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
