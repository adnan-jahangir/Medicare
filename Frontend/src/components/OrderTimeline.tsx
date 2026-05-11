import { ORDER_STAGES, type OrderStatus } from '@/lib/types';
import { Check, Clock, PackageCheck, Pill, Truck } from 'lucide-react';

const ICONS: Record<OrderStatus, typeof Clock> = {
  Pending: Clock,
  Confirmed: Check,
  Preparing: Pill,
  Ready: PackageCheck,
  Delivered: Truck,
};

export const OrderTimeline = ({ status }: { status: OrderStatus }) => {
  const currentIdx = ORDER_STAGES.indexOf(status);
  return (
    <ol className="relative grid grid-cols-5 gap-2">
      {ORDER_STAGES.map((s, i) => {
        const Icon = ICONS[s];
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex flex-col items-center text-center relative">
            {i < ORDER_STAGES.length - 1 && (
              <span className={`absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div
              className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition-all ${
                done ? 'bg-primary border-primary text-primary-foreground' :
                active ? 'bg-card border-primary text-primary shadow-glow' :
                'bg-muted border-border text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {active && <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40" />}
            </div>
            <span className={`mt-2 text-xs font-medium ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
