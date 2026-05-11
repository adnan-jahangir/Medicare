import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { MedicineCard } from '@/components/MedicineCard';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { wishlist, medicines } = useAppStore();
  const items = medicines.filter((m) => wishlist.includes(m.id));

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="font-display font-bold text-2xl mt-4">Your wishlist is empty</h2>
        <p className="text-muted-foreground mt-2">Save medicines you want to buy later.</p>
        <Button asChild className="mt-5 rounded-full"><Link to="/medicines">Browse medicines</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Wishlist</h1>
      <p className="text-muted-foreground mb-8">{items.length} saved</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((m, i) => <MedicineCard key={m.id} medicine={m} index={i} />)}
      </div>
    </div>
  );
}
