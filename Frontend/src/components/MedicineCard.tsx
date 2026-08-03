import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import type { Medicine } from '@/lib/types';
import { motion } from 'framer-motion';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';

import { toast } from 'sonner';

interface Props { medicine: Medicine; index?: number }

export const MedicineCard = ({ medicine, index = 0 }: Props) => {
  const { addToCart, toggleWishlist, wishlist, user } = useAppStore();
  const isDriver = user?.role === 'driver';
  const inWishlist = wishlist.includes(medicine.id);
  const oos = medicine.stock === 0;
  const isRxRequired = (medicine as any).requires_prescription || medicine.prescriptionRequired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300"
    >
      {/* Fixed aspect-ratio image container with soft background */}
      <Link to={`/medicines/${medicine.id}`} className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/60 to-muted/30">
        <img
          src={getMedicineImageUrl(medicine)}
          alt={medicine.name}
          loading="lazy"
          onError={(e) => handleMedicineImgError(e, medicine)}
          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {isRxRequired && (
          <span className="absolute top-3 left-3 pill bg-warning/15 text-warning-foreground border-warning/30">
            <FileWarning className="h-3 w-3" /> Rx
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(medicine.id); }}
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-card/90 backdrop-blur hover:scale-110 transition-transform"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : 'text-foreground/60'}`} />
        </button>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Badge variant="secondary" className="self-start mb-2 text-[10px] uppercase tracking-wider">{medicine.category}</Badge>
        <Link to={`/medicines/${medicine.id}`} className="font-display font-semibold leading-tight hover:text-primary transition-colors">
          {medicine.name}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">{medicine.brand} · {medicine.strength}</div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div>
            <div className="font-display font-bold text-lg">
              <span className="text-[1.1em] mr-0.5">৳</span>{medicine.price.toFixed(2)}
            </div>
            <div className={`text-[10px] uppercase tracking-wider font-medium ${oos ? 'text-destructive' : 'text-success'}`}>
              {oos ? 'Out of stock' : `${medicine.stock} in stock`}
            </div>
          </div>
          {!isDriver && (
            <Button
              size="sm"
              disabled={oos}
              onClick={() => {
                addToCart(medicine.id);
                toast.success(`Added '${medicine.name}' to cart!`);
              }}
              className="rounded-full"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
