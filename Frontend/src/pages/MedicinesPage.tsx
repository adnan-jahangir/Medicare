import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { MedicineCard } from '@/components/MedicineCard';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';

const CATS = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Diabetes', 'Heart', 'Skin Care'];

export default function MedicinesPage() {
  const { medicines } = useAppStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [categories, setCategories] = useState<string[]>(params.get('cat') ? [params.get('cat')!] : []);
  
  // ১. স্লাইডারের ডিফল্ট রেঞ্জ ২০ থেকে বাড়িয়ে ২০০ করা হলো
  const [maxPrice, setMaxPrice] = useState(200);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [noRxOnly, setNoRxOnly] = useState(false);

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (q) newParams.set('q', q);
    if (categories.length === 1) newParams.set('cat', categories[0]);
    setParams(newParams, { replace: true });
  }, [q, categories, setParams]);

  const filtered = useMemo(() => {
    const safeList = Array.isArray(medicines) ? medicines : [];
    const ql = q.toLowerCase();
    return safeList.filter((m) => {
      if (ql && !`${m.name} ${m.brand} ${m.category} ${m.description}`.toLowerCase().includes(ql)) return false;
      if (categories.length && !categories.includes(m.category)) return false;
      if (m.price > maxPrice) return false;
      if (inStockOnly && m.stock === 0) return false;
      
  
      const rxRequired = m.requires_prescription || m.prescriptionRequired;
      if (noRxOnly && rxRequired) return false;
      
      return true;
    });
  }, [medicines, q, categories, maxPrice, inStockOnly, noRxOnly]);

  const toggleCat = (c: string) => setCategories((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  const Filters = () => (
    <div className="space-y-7">
      <div>
        <h4 className="font-display font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Category</h4>
        <div className="space-y-2">
          {CATS.map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={categories.includes(c)} onCheckedChange={() => toggleCat(c)} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Price up to ৳{maxPrice}</h4>
        {/* স্লাইডারের ম্যাক্স ভ্যালু ২০০ করা হয়েছে */}
        <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} min={1} max={200} step={1} />
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={inStockOnly} onCheckedChange={(v) => setInStockOnly(!!v)} />
          <span className="text-sm">In stock only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={noRxOnly} onCheckedChange={(v) => setNoRxOnly(!!v)} />
          <span className="text-sm">No prescription required</span>
        </label>
      </div>
      {(categories.length || q || maxPrice < 200 || inStockOnly || noRxOnly) ? (
        <Button variant="ghost" size="sm" onClick={() => { setCategories([]); setQ(''); setMaxPrice(200); setInStockOnly(false); setNoRxOnly(false); }}>
          <X className="h-3 w-3 mr-1" /> Clear filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl">All medicines</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} products available</p>
        </div>
        <div className="flex gap-2 md:w-96">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, brand…" className="pl-9 rounded-full" />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden rounded-full"><SlidersHorizontal className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><Filters /></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden md:block sticky top-24 self-start">
          <Filters />
        </aside>
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No medicines match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((m, i) => <MedicineCard key={m.id} medicine={m} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
