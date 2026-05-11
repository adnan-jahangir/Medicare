import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Props { icon: LucideIcon; label: string; value: ReactNode; trend?: string; tone?: 'primary' | 'accent' | 'success' | 'warning' }

export const StatCard = ({ icon: Icon, label, value, trend, tone = 'primary' }: Props) => {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        {trend && <span className="text-xs font-medium text-success">{trend}</span>}
      </div>
      <div className="mt-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-display font-bold text-2xl mt-1 tabular-nums">{value}</div>
      </div>
    </div>
  );
};
