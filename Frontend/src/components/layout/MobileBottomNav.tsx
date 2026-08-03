import { NavLink, useLocation } from 'react-router-dom';
import { Home, Pill, FileText, ShoppingCart, User, LayoutDashboard, ShoppingBag, Package, Users, Building2, Truck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';

export const MobileBottomNav = () => {
  const { cart, user } = useAppStore();
  const { pathname } = useLocation();
  const cartCount = cart?.reduce((s, c) => s + (c?.quantity || 0), 0) || 0;

  const role = user?.role;

  // Define role-specific navigation items for mobile/tablet users
  const getNavItems = () => {
    if (role === 'owner' || role === 'pharmacy' || role === 'vendor' || role === 'shop_owner') {
      return [
        { label: 'Overview', to: '/owner', icon: LayoutDashboard },
        { label: 'Medicines', to: '/owner/medicines', icon: Pill },
        { label: 'Orders', to: '/owner/orders', icon: ShoppingBag },
        { label: 'Store', to: '/', icon: Home },
        { label: 'Profile', to: '/update-profile', icon: User },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Overview', to: '/admin', icon: LayoutDashboard },
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Drivers', to: '/admin/drivers', icon: Truck },
        { label: 'Pharmacies', to: '/admin/pharmacies', icon: Building2 },
        { label: 'Orders', to: '/admin/orders', icon: Package },
      ];
    }

    if (role === 'driver') {
      return [
        { label: 'Dashboard', to: '/driver', icon: LayoutDashboard },
        { label: 'Profile', to: '/update-profile', icon: User },
      ];
    }

    // Default Customer / Logged out view
    return [
      { label: 'Home', to: '/', icon: Home, end: true },
      { label: 'Medicines', to: '/medicines', icon: Pill },
      { label: 'Upload Rx', to: '/prescription', icon: FileText },
      { label: 'Cart', to: '/cart', icon: ShoppingCart, isCart: true },
      { label: user ? 'Account' : 'Login', to: user ? '/dashboard' : '/login', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/60 shadow-lg px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || item.to === '/owner' || item.to === '/admin' || item.to === '/driver'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
                  isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.isCart && cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground flex items-center justify-center rounded-full">
                    {cartCount}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
