import { useMemo } from 'react';
import { MapPin, ExternalLink, Truck, Phone, Star, ShieldCheck, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { parseChittagongCoords } from '@/lib/chittagongMap';

export interface DriverInfo {
  name?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  rating?: number;
  vehicleType?: string;
}

interface MiniDeliveryMapProps {
  coords?: { lat: number; lng: number } | [number, number] | any;
  address?: string;
  customerName?: string;
  customerPhone?: string;
  driver?: DriverInfo | null;
  orderStatus?: string;
}

export function MiniDeliveryMap({
  coords,
  address,
  customerName,
  customerPhone,
  driver,
  orderStatus,
}: MiniDeliveryMapProps) {
  const [lat, lng] = useMemo(() => parseChittagongCoords(coords), [coords]);
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const hasAssignedDriver = Boolean(
    driver && typeof driver === 'object' && (driver.name || driver.phoneNumber)
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm text-foreground">
          <MapPin className="h-4 w-4 text-primary" /> Delivery & Courier Details
        </h3>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full transition-colors"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Customer Delivery Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-primary" />
            <span>Delivery Destination</span>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            📍 Chattogram
          </span>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/70 text-foreground/90 font-medium leading-relaxed">
          {address && address !== '[MASKED]'
            ? address
            : 'GEC Circle, Central Chattogram, Bangladesh'}
        </div>

        {(customerName || customerPhone) && (
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            {customerName && customerName !== '[MASKED]' && (
              <div className="p-2.5 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground block text-[10px] font-medium">Recipient</span>
                <span className="text-foreground font-semibold truncate block mt-0.5">{customerName}</span>
              </div>
            )}
            {customerPhone && customerPhone !== '[MASKED]' && (
              <div className="p-2.5 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground block text-[10px] font-medium">Contact Phone</span>
                <span className="text-foreground font-semibold truncate block mt-0.5">{customerPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Driver / Courier Details Section ── */}
      <div className="pt-3 border-t border-border/70">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Truck className="h-3.5 w-3.5 text-primary" /> Delivery Rider
          </span>
          {hasAssignedDriver ? (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Assigned
            </span>
          ) : (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {['Ready', 'Confirmed', 'Preparing'].includes(orderStatus || '') ? 'Preparing' : 'Pending'}
            </span>
          )}
        </div>

        {hasAssignedDriver && driver ? (
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0 shadow-xs">
              <AvatarImage src={driver.profilePhoto} alt={driver.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                {(driver.name || 'D').charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm text-foreground truncate flex items-center gap-1">
                <span>{driver.name || 'Assigned Courier'}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <div className="flex items-center gap-0.5 font-bold text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{driver.rating || '5.0'}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground truncate">
                  {driver.vehicleType || 'Motorbike'}
                </span>
              </div>
            </div>

            {driver.phoneNumber && driver.phoneNumber !== '[MASKED]' && (
              <Button
                asChild
                size="sm"
                className="rounded-full h-9 px-3 gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <a href={`tel:${driver.phoneNumber}`}>
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Call</span>
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-center gap-2.5 text-xs text-muted-foreground">
            <Truck className="h-4 w-4 text-primary shrink-0 animate-pulse" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-foreground block">
                {['Ready', 'Confirmed', 'Preparing'].includes(orderStatus || '')
                  ? 'Awaiting courier pickup'
                  : 'Assigning nearest Chittagong rider...'}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                Rider name & contact will appear here once assigned
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiniDeliveryMap;
