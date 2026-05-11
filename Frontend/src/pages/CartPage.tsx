import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, Pill, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, medicines, updateCartQty, removeFromCart, clearCart } = useAppStore();
  const items = cart.map((c) => ({ ...c, medicine: medicines.find((m) => m.id === c.medicineId)! })).filter((i) => i.medicine);
  const subtotal = items.reduce((s, i) => s + i.medicine.price * i.quantity, 0);
  const delivery = subtotal === 0 ? 0 : subtotal >= 25 ? 0 : 3.99;
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 className="font-display font-bold text-2xl">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Browse medicines and add them to your cart.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/medicines">Shop medicines</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Your pharmacy cart</h1>
      <p className="text-muted-foreground mb-8">{items.length} item{items.length !== 1 && 's'}</p>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Items - pharmacy receipt style */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-dashed border-border flex items-center gap-2 bg-gradient-soft">
            <Pill className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">Prescription receipt</h3>
            <button onClick={clearCart} className="ml-auto text-xs text-muted-foreground hover:text-destructive">Clear all</button>
          </div>

          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <div>Medicine</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit price</div>
            <div className="text-right">Subtotal</div>
            <div />
          </div>

          {items.map((item) => (
            <div key={item.medicineId} className="grid grid-cols-[80px_1fr] sm:grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-5 py-4 border-b border-dashed border-border last:border-b-0 items-center">
              <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                <img src={item.medicine.image} alt={item.medicine.name} className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="font-display font-semibold truncate">{item.medicine.name}</div>
                  <div className="text-xs text-muted-foreground">{item.medicine.brand} · {item.medicine.strength}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">Dosage: {item.medicine.dosage}</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="inline-flex items-center rounded-full border border-border">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateCartQty(item.medicineId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateCartQty(item.medicineId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>

              <div className="text-right text-sm tabular-nums">${item.medicine.price.toFixed(2)}</div>
              <div className="text-right font-display font-bold tabular-nums">${(item.medicine.price * item.quantity).toFixed(2)}</div>
              <button onClick={() => removeFromCart(item.medicineId)} className="text-muted-foreground hover:text-destructive justify-self-end">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display font-semibold mb-5">Order summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">${subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{delivery === 0 ? <span className="text-success font-medium">Free</span> : `$${delivery.toFixed(2)}`}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax (8%)</dt><dd className="tabular-nums">${tax.toFixed(2)}</dd></div>
              <div className="border-t border-dashed border-border pt-3 flex justify-between items-baseline">
                <dt className="font-display font-semibold">Grand total</dt>
                <dd className="font-display font-bold text-2xl tabular-nums">${total.toFixed(2)}</dd>
              </div>
            </dl>
            <Button asChild size="lg" className="w-full mt-6 rounded-full">
              <Link to="/checkout">Checkout <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            {subtotal < 25 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Add ${(25 - subtotal).toFixed(2)} more for free delivery 🚚
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
