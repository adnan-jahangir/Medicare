import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, FileWarning, ChevronLeft, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MedicineDetailPage() {
  const { id } = useParams();
  const { medicines, addToCart, toggleWishlist, wishlist, pharmacies } = useAppStore();
  const m = medicines.find((x) => x.id === id);
  const [qty, setQty] = useState(1);
  const nav = useNavigate();

  if (!m) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Medicine not found.</p>
      <Button asChild className="mt-4"><Link to="/medicines">Back to medicines</Link></Button>
    </div>
  );

  const pharmacy = pharmacies.find((p) => p.id === m.pharmacyId);
  const inWishlist = wishlist.includes(m.id);

  return (
    <div className="container py-8">
      <Link to="/medicines" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-3xl overflow-hidden bg-gradient-soft aspect-square">
          <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <Badge variant="secondary" className="mb-3">{m.category}</Badge>
          <h1 className="font-display font-bold text-3xl md:text-4xl">{m.name}</h1>
          <p className="text-muted-foreground mt-1">{m.brand} · {m.strength}</p>

          <div className="flex items-baseline gap-3 mt-6">
            <span className="font-display font-bold text-4xl">${m.price.toFixed(2)}</span>
            <span className={`text-sm font-medium ${m.stock === 0 ? 'text-destructive' : 'text-success'}`}>
              {m.stock === 0 ? 'Out of stock' : `${m.stock} in stock`}
            </span>
          </div>

          {m.prescriptionRequired && (
            <div className="mt-5 p-3 rounded-xl border border-warning/30 bg-warning/10 flex items-start gap-2 text-sm">
              <FileWarning className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <strong className="font-semibold">Prescription required.</strong> You'll be asked to upload one at checkout.
              </div>
            </div>
          )}

          <p className="mt-6 text-foreground/80 leading-relaxed">{m.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted">
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Strength</dt>
              <dd className="font-display font-semibold mt-1">{m.strength}</dd>
            </div>
            <div className="p-4 rounded-xl bg-muted">
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Dosage</dt>
              <dd className="font-display font-semibold mt-1 text-sm">{m.dosage}</dd>
            </div>
          </dl>

          {pharmacy && (
            <div className="mt-4 text-sm text-muted-foreground">
              Sold by <span className="font-semibold text-foreground">{pharmacy.name}</span> · {pharmacy.city} · ⭐ {pharmacy.rating}
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button
              size="lg"
              disabled={m.stock === 0}
              onClick={() => { addToCart(m.id, qty); toast.success(`Added ${qty} × ${m.name} to cart`); }}
              className="rounded-full flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to cart
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => toggleWishlist(m.id)}>
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
          </div>

          <Button variant="ghost" className="mt-3 w-full" onClick={() => { addToCart(m.id, qty); nav('/cart'); }}>
            Buy now →
          </Button>
        </div>
      </div>
    </div>
  );
}
