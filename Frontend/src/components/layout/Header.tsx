import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Pill, LayoutDashboard, ShieldCheck, User, LogOut, Menu } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { Role } from '@/lib/types';

const ROLES: { id: Role; label: string; path: string; icon: typeof User }[] = [
  { id: 'customer', label: 'Customer', path: '/', icon: User },
  { id: 'owner', label: 'Shop Owner', path: '/owner', icon: LayoutDashboard },
  { id: 'admin', label: 'Admin', path: '/admin', icon: ShieldCheck },
];

export const Header = () => {
  const { cart, wishlist, role, user, logout } = useAppStore();
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const { pathname } = useLocation();

  const isStorefront = !pathname.startsWith('/owner') && !pathname.startsWith('/admin') && !pathname.startsWith('/dashboard');

  const customerNav = (
    <>
      <NavLink to="/" end className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Home</NavLink>
      <NavLink to="/medicines" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Medicines</NavLink>
      {user && user.role === 'customer' && (
        <NavLink to="/orders" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>My Orders</NavLink>
      )}
      <NavLink to="/prescription" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Upload Rx</NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="container flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Pill className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="hidden sm:inline">MediCare</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {pathname.startsWith('/owner') || pathname.startsWith('/admin') ? (
            <NavLink to="/" className="text-sm font-medium text-foreground/70 hover:text-primary">← Back to store</NavLink>
          ) : customerNav}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {user && !isStorefront && (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
              {ROLES.find((r) => r.id === role)?.label ?? role}
            </div>
          )}

          <Link to="/wishlist" className="relative">
            <Button variant="ghost" size="icon"><Heart className="h-5 w-5" /></Button>
            {wishlist.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground">{wishlist.length}</Badge>
            )}
          </Link>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon"><ShoppingCart className="h-5 w-5" /></Button>
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground">{cartCount}</Badge>
            )}
          </Link>

          {user ? (
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to={user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : '/dashboard'}>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {user.name.charAt(0)}
                </span>
                <span className="hidden sm:inline text-sm">{user.name.split(' ')[0]}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                {customerNav}
                <div className="h-px bg-border my-2" />
                {ROLES.map((r) => (
                  <Link key={r.id} to={r.path} className="flex items-center gap-2 text-sm">
                    <r.icon className="h-4 w-4" /> {r.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
