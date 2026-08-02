import { NavLink } from 'react-router-dom';
import { Home, Pill, FileText, ShoppingCart, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';

export const MobileBottomNav = () => {
  const { cart, user } = useAppStore();
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const getProfilePath = () => {
    if (!user) return '/login';
    if (user.role === 'owner') return '/owner';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'driver') return '/driver';
    return '/dashboard';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/60 shadow-lg px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/medicines"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <Pill className="h-5 w-5" />
          <span>Medicines</span>
        </NavLink>

        <NavLink
          to="/prescription"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <FileText className="h-5 w-5" />
          <span>Upload Rx</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground flex items-center justify-center rounded-full">
                {cartCount}
              </Badge>
            )}
          </div>
          <span>Cart</span>
        </NavLink>

        <NavLink
          to={getProfilePath()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <User className="h-5 w-5" />
          <span>{user ? 'Account' : 'Login'}</span>
        </NavLink>
      </div>
    </div>
  );
};
