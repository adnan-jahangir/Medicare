import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Pill, LayoutDashboard, ShieldCheck, User, ChevronDown, LogOut, Package } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Role } from '@/lib/types';

const ROLES: { id: Role; label: string; path: string; icon: typeof User }[] = [
  { id: 'customer', label: 'Customer', path: '/', icon: User },
  { id: 'owner', label: 'Shop Owner', path: '/owner', icon: LayoutDashboard },
  { id: 'admin', label: 'Admin', path: '/admin', icon: ShieldCheck },
];

export const Header = () => {
  try {
  const { cart, wishlist, role, user, logout } = useAppStore();
  const isDriver = user?.role === 'driver';
  const isOwner = user?.role === 'owner';
  const cartCount = cart?.reduce((s, c) => s + (c?.quantity || 0), 0) || 0;
  const { pathname } = useLocation();

  const isStorefront = !pathname.startsWith('/owner') && !pathname.startsWith('/admin') && !pathname.startsWith('/dashboard');

  // Safe user display helpers
  const userInitial = (() => {
    try { return String(user?.name || user?.email || 'U').charAt(0).toUpperCase(); } catch { return 'U'; }
  })();
  const userDisplayName = (() => {
    try { return String(user?.name || user?.email || 'User').split(' ')[0]; } catch { return 'User'; }
  })();

  const customerNav = (
    <>
      <NavLink to="/" end className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Home</NavLink>
      {!isDriver && (
        <NavLink to="/medicines" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Medicines</NavLink>
      )}
      {user && user.role === 'customer' && (
        <NavLink to="/dashboard" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Dashboard</NavLink>
      )}
      {user && user.role === 'customer' && (
        <NavLink to="/orders" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>My Orders</NavLink>
      )}
      {isDriver && (
        <NavLink to="/driver" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Dashboard</NavLink>
      )}
      {!isDriver && (
        <NavLink to="/prescription" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/70'}`}>Upload Rx</NavLink>
      )}
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

          {!isDriver && (
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon"><Heart className="h-5 w-5" /></Button>
              {(wishlist?.length || 0) > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground">{wishlist.length}</Badge>
              )}
            </Link>
          )}

          {!isDriver && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon"><ShoppingCart className="h-5 w-5" /></Button>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground">{cartCount}</Badge>
              )}
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2 hover:bg-primary/10">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold ring-2 ring-primary/20">
                    {userInitial}
                  </span>
                  <span className="hidden md:inline-block font-medium text-sm max-w-[120px] truncate">
                    {userDisplayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{String(user.name || 'User')}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{String(user.email || '')}</p>
                    <span className="inline-flex items-center text-[10px] font-semibold text-primary uppercase mt-1">
                      Role: {user.role || role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/dashboard'} className="cursor-pointer flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/update-profile" className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === 'customer' && (
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
  } catch (err) {
    console.error('[Header crash]', err);
    // Minimal fallback header so the app doesn't die
    return (
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background">
        <div className="container flex h-16 items-center gap-6">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">MediCare</a>
          <div className="ml-auto">
            <a href="/login" className="text-sm font-medium text-primary">Sign in</a>
          </div>
        </div>
      </header>
    );
  }
};
