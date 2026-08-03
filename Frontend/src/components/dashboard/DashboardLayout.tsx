import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Pill, LayoutDashboard, Package, Users, Building2, ShoppingBag, ShieldCheck, ChevronLeft, User as UserIcon, LogOut, Truck, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Role } from '@/lib/types';

interface Props { role: Role; children: ReactNode; title: string; subtitle?: string }

const NAV: Record<Role, { label: string; to: string; icon: typeof Pill }[]> = {
  customer: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Medicines', to: '/medicines', icon: Pill },
    { label: 'Orders', to: '/orders', icon: ShoppingBag },
    { label: 'Prescription', to: '/prescription', icon: Package },
    { label: 'Profile', to: '/update-profile', icon: UserIcon },
  ],
  owner: [
    { label: 'Dashboard', to: '/owner', icon: LayoutDashboard },
    { label: 'Medicines', to: '/owner/medicines', icon: Pill },
    { label: 'Orders', to: '/owner/orders', icon: ShoppingBag },
    { label: 'Profile', to: '/update-profile', icon: UserIcon },
  ],
  admin: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Approvals', to: '/admin/drivers', icon: Truck },
    { label: 'Pharmacies', to: '/admin/pharmacies', icon: Building2 },
    { label: 'Medicines', to: '/admin/medicines', icon: Pill },
    { label: 'Orders', to: '/admin/orders', icon: Package },
    { label: 'Profile', to: '/update-profile', icon: UserIcon },
  ],
  driver: [
    { label: 'Dashboard', to: '/driver', icon: LayoutDashboard },
    { label: 'Profile', to: '/update-profile', icon: UserIcon },
  ],
};

const ROLE_META: Record<Role, { name: string; icon: typeof Pill }> = {
  owner: { name: 'Shop Owner', icon: LayoutDashboard },
  admin: { name: 'Admin', icon: ShieldCheck },
  customer: { name: 'Customer', icon: Pill },
  driver: { name: 'Delivery Agent', icon: Truck },
};

export const DashboardLayout = ({ role, children, title, subtitle }: Props) => {
  const items = NAV[role];
  const meta = ROLE_META[role];
  const { logout, user } = useAppStore();

  return (
    <div className="min-h-[calc(100vh-4rem)] grid md:grid-cols-[260px_1fr] bg-muted/30 max-w-full overflow-x-hidden">
      <aside className="hidden md:flex flex-col border-r border-border bg-card">
        <div className="p-5 border-b border-border">
          {role !== 'driver' && (
            <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-3">
              <ChevronLeft className="h-3 w-3" /> Back to store
            </Link>
          )}
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary">
              <meta.icon className="h-4 w-4 text-primary-foreground" />
            </span>
            <div>
              <div className="font-display font-bold text-sm leading-tight">{meta.name}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Console</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/owner' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10 font-medium mt-4"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </aside>

      <div className="min-w-0 max-w-full overflow-x-hidden">
        <div className="border-b border-border bg-card px-4 md:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl md:text-2xl">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 shadow-sm transition-all" aria-label="Dashboard settings">
                  <Settings className="h-4 w-4 text-foreground/80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
                  {String(user.name || user.email || 'User')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/update-profile" className="cursor-pointer flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Update Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="p-4 sm:p-6 md:p-10 min-w-0 max-w-full overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
};
