import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Truck, ShieldCheck, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { MedicineCard } from '@/components/MedicineCard';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';

const CATS = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Diabetes', 'Heart', 'Skin Care'];

export default function HomePage() {
  const { medicines } = useAppStore();
  const safeMedicines = Array.isArray(medicines) ? medicines : [];
  const featured = safeMedicines.slice(0, 8);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero relative overflow-hidden">
        <div className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="pill bg-card shadow-sm mb-5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>24/7 delivery in your city</span>
            </span>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] text-balance">
              Your trusted pharmacy, <span className="text-primary-deep">delivered</span> with care.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Search thousands of medicines, upload prescriptions, and track your delivery in real time on a live map.
            </p>

            <form
              className="mt-7 flex gap-2 max-w-lg p-1.5 rounded-full bg-card border border-border/60 shadow-card"
              onSubmit={(e) => { e.preventDefault(); nav(`/medicines?q=${encodeURIComponent(q)}`); }}
            >
              <div className="flex items-center pl-4 text-muted-foreground"><Search className="h-4 w-4" /></div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search paracetamol, vitamin D, antibiotics…"
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
              />
              <Button type="submit" className="rounded-full px-6">Search</Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {CATS.slice(0, 5).map((c) => (
                <Link key={c} to={`/medicines?cat=${encodeURIComponent(c)}`} className="pill hover:border-primary hover:text-primary transition-colors">
                  {c}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-8 bg-gradient-primary rounded-full blur-3xl opacity-20" />
            <div className="relative grid grid-cols-2 gap-4">
              {featured.slice(0, 4).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`rounded-2xl overflow-hidden border border-border/60 bg-card shadow-card ${i % 2 === 0 ? 'translate-y-4' : '-translate-y-2'}`}
                >
                  <img src={getMedicineImageUrl(m)} alt={m.name} onError={(e) => handleMedicineImgError(e, m)} className="aspect-square w-full object-cover" />
                  <div className="p-3">
                    <div className="font-display font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.strength} · <span className="text-[1.1em]">৳</span>{m.price.toFixed(2)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="container py-12 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Truck, title: 'Free delivery', desc: <>On orders over <span className="text-[1.1em]">৳</span>25</> },
          { icon: ShieldCheck, title: 'Verified medicines', desc: 'Sourced from licensed pharmacies' },
          { icon: Clock, title: 'Live tracking', desc: 'See your delivery on the map' },
        ].map((f) => (
          <div key={f.title} className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="container py-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-bold text-2xl md:text-3xl">Shop by category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATS.map((c) => (
            <Link
              key={c}
              to={`/medicines?cat=${encodeURIComponent(c)}`}
              className="aspect-square rounded-2xl border border-border/60 bg-gradient-soft p-4 flex flex-col justify-end hover:border-primary hover:shadow-card hover:-translate-y-1 transition-all"
            >
              <div className="text-xs text-muted-foreground">Browse</div>
              <div className="font-display font-semibold leading-tight mt-1">{c}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-bold text-2xl md:text-3xl">Popular medicines</h2>
          <Link to="/medicines" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((m, i) => <MedicineCard key={m.id} medicine={m} index={i} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-deep p-10 md:p-14 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 bg-primary-glow/30 blur-3xl rounded-full" />
          <div className="relative max-w-2xl">
            <h3 className="font-display font-bold text-3xl md:text-4xl">Have a prescription?</h3>
            <p className="mt-3 text-primary-foreground/80 text-lg">
              Upload it and our pharmacist will verify, fulfill, and dispatch within minutes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 rounded-full">
              <Link to="/prescription">Upload prescription <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
