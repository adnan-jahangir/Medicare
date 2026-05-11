import { Pill } from 'lucide-react';

export const Footer = () => (
  <footer className="border-t border-border/50 mt-20 bg-gradient-soft">
    <div className="container py-10 grid gap-8 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Pill className="h-4 w-4 text-primary-foreground" />
          </span>
          MediCare
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          A modern pharmacy management platform — search, order, track in real time.
        </p>
      </div>
      {[
        { title: 'Shop', items: ['Medicines', 'Vitamins', 'Skin Care', 'Prescriptions'] },
        { title: 'Company', items: ['About', 'Pharmacies', 'Careers', 'Contact'] },
        { title: 'Support', items: ['Help center', 'Returns', 'Privacy', 'Terms'] },
      ].map((c) => (
        <div key={c.title}>
          <h4 className="font-display font-semibold text-sm mb-3">{c.title}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {c.items.map((i) => <li key={i} className="hover:text-primary cursor-pointer transition-colors">{i}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} MediCare. Demo build — not for medical advice.
    </div>
  </footer>
);
