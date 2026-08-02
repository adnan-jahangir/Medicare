import { type OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Package, CheckCircle, ChefHat, PackageCheck, Truck, Home, XCircle } from 'lucide-react';

// Customer-friendly timeline steps that map to backend statuses
const STEPS = [
  { label: 'Placed',     statuses: ['Pending'],                                      icon: Package },
  { label: 'Accepted',   statuses: ['Confirmed'],                                    icon: CheckCircle },
  { label: 'Preparing',  statuses: ['Preparing'],                                    icon: ChefHat },
  { label: 'Ready',      statuses: ['Ready'],                                        icon: PackageCheck },
  { label: 'In Transit', statuses: ['Driver Assigned', 'Picked Up', 'On the Way'],   icon: Truck },
  { label: 'Delivered',  statuses: ['Arrived', 'Delivered', 'Completed'],             icon: Home },
];

const getStepIndex = (status: string): number => {
  const idx = STEPS.findIndex(s => s.statuses.includes(status));
  return idx === -1 ? 0 : idx;
};

export const OrderTimeline = ({ status }: { status: OrderStatus }) => {
  const isCancelled = status === 'Cancelled';
  const currentIdx = getStepIndex(status);

  if (isCancelled) {
    return (
      <div className="relative w-full px-4 mb-8">
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-display font-bold text-destructive">Order Cancelled</p>
            <p className="text-xs text-muted-foreground">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full px-4 mb-8">
      {/* Connector Line Base */}
      <div className="absolute top-5 left-8 right-8 h-1 bg-border rounded-full" />
      
      {/* Connector Line Progress */}
      <div 
        className="absolute top-5 left-8 h-1 bg-primary rounded-full transition-all duration-700 ease-in-out" 
        style={{ width: `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 16px)` }}
      />

      <div className="relative flex justify-between w-full">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isActive = i === currentIdx;
          const isPending = i > currentIdx;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex flex-col items-center z-10 group">
              <div 
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-500",
                  isCompleted ? "bg-primary border-primary text-white scale-100" : 
                  isActive ? "bg-card border-primary ring-4 ring-primary/20 text-primary scale-110" : 
                  "bg-card border-border text-muted-foreground/50"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                )}
                <Icon className={cn(
                  "h-4 w-4 relative z-10 transition-all",
                  isActive && "animate-pulse"
                )} />
              </div>
              <span 
                className={cn(
                  "mt-3 text-[11px] font-bold whitespace-nowrap transition-colors",
                  isActive ? "text-primary" : 
                  isCompleted ? "text-foreground" : 
                  "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
