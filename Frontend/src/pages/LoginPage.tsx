import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { Building2, Pill, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const PANEL_OPTIONS = [
  { id: 'customer', label: 'Customer', description: 'Browse medicines, place orders, and track delivery', icon: User, path: '/dashboard' },
  { id: 'owner', label: 'Shop Owner', description: 'Manage medicines and orders for your pharmacy', icon: Building2, path: '/owner' },
  { id: 'admin', label: 'Admin', description: 'Oversee users, pharmacies, and system activity', icon: ShieldCheck, path: '/admin' },
] as const;

export default function LoginPage() {
  const { setAuth, setRole, user } = useAppStore();
  const nav = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') nav('/admin');
      else if (user.role === 'owner') nav('/owner');
      else nav('/dashboard');
    }
  }, [user, nav]);
  const [name, setName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [houseLocation, setHouseLocation] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopOwnerName, setShopOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [panel, setPanel] = useState<(typeof PANEL_OPTIONS)[number]['id']>('customer');

  const handleSubmit = async (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault();
    const selectedPanel = PANEL_OPTIONS.find((option) => option.id === panel)!;
    
    try {
      let res;
      if (mode === 'register') {
        const role = selectedPanel.id;
        const payload: Record<string, any> = {
          name: selectedPanel.id === 'owner' ? shopOwnerName : name,
          email,
          password: pwd,
          role,
        };

        if (selectedPanel.id === 'owner') {
          payload.shopCode = shopCode;
          payload.shopName = shopName;
          payload.shopLocation = shopLocation;
          payload.shopOwnerName = shopOwnerName;
          payload.phoneNumber = phoneNumber;
        } else if (selectedPanel.id === 'customer') {
          payload.phoneNumber = customerPhoneNumber;
          payload.shopLocation = houseLocation;
        }

        Object.keys(payload).forEach((key) => {
          if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
            delete payload[key];
          }
        });

        res = await api.post('/auth/register', payload);
      } else {
        const loginEmail = selectedPanel.id === 'owner' ? `${shopCode}@shop.local` : email;
        res = await api.post('/auth/login', { email: loginEmail, password: pwd });
      }

      const authData = res.data.data ?? res.data;
      setAuth(authData, authData.token);
      toast.success(mode === 'login' ? `Welcome back, ${selectedPanel.label}!` : 'Account created');
      nav(selectedPanel.path);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 bg-gradient-hero">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-xl mb-8">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </span>
            MediCare
          </Link>

          <div className="mb-6 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose your panel</p>
            <div className="grid gap-2">
              {PANEL_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = panel === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPanel(option.id)}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      active ? 'border-primary bg-primary/10' : 'border-border/60 bg-background/70 hover:border-primary/40'
                    }`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium leading-none">{option.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h1 className="font-display font-bold text-3xl">Welcome back</h1>
              <p className="text-muted-foreground mt-1 mb-6">
                {panel === 'owner'
                  ? 'Sign in with your shop code to open the shop owner panel.'
                  : `Sign in to open your ${PANEL_OPTIONS.find((option) => option.id === panel)?.label.toLowerCase()} dashboard.`}
              </p>
              <form className="space-y-4" onSubmit={(e) => handleSubmit(e, 'login')}>
                {panel === 'owner' ? (
                  <div><Label htmlFor="sc-login">Shop code</Label><Input id="sc-login" required value={shopCode} onChange={(e) => setShopCode(e.target.value)} className="mt-1.5" placeholder="GLP-1024" /></div>
                ) : (
                  <div><Label htmlFor="le">Email</Label><Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" /></div>
                )}
                <div><Label htmlFor="lp">Password</Label><Input id="lp" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1.5" /></div>
                <Button type="submit" size="lg" className="w-full rounded-full">Sign in</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <h1 className="font-display font-bold text-3xl">Create account</h1>
              <p className="text-muted-foreground mt-1 mb-6">
                {panel === 'owner'
                  ? 'Create a new shop owner account with your pharmacy details.'
                  : panel === 'customer'
                    ? 'Create a customer account so we can find the nearest pharmacy faster.'
                    : 'Create a new account for your selected panel.'}
              </p>
              <form className="space-y-4" onSubmit={(e) => handleSubmit(e, 'register')}>
                {panel === 'owner' ? (
                  <>
                    <div><Label htmlFor="sc">Shop code</Label><Input id="sc" required value={shopCode} onChange={(e) => setShopCode(e.target.value)} className="mt-1.5" placeholder="GLP-1024" /></div>
                    <div><Label htmlFor="sn">Shop name</Label><Input id="sn" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="mt-1.5" placeholder="GreenLeaf Pharmacy" /></div>
                    <div><Label htmlFor="son">Shop owner name</Label><Input id="son" required value={shopOwnerName} onChange={(e) => setShopOwnerName(e.target.value)} className="mt-1.5" placeholder="Dr. Amelia Cole" /></div>
                    <div><Label htmlFor="sp">Number</Label><Input id="sp" type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1.5" placeholder="+1 555 123 4567" /></div>
                    <div><Label htmlFor="sl">Shop location</Label><Input id="sl" required value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} className="mt-1.5" placeholder="New York, NY" /></div>
                  </>
                ) : panel === 'customer' ? (
                  <>
                    <div><Label htmlFor="rn">Full name</Label><Input id="rn" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="John Carter" /></div>
                    <div><Label htmlFor="cp">Phone number</Label><Input id="cp" type="tel" required value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} className="mt-1.5" placeholder="+1 555 987 6543" /></div>
                    <div><Label htmlFor="hl">House location</Label><Input id="hl" required value={houseLocation} onChange={(e) => setHouseLocation(e.target.value)} className="mt-1.5" placeholder="Apt 4B, 12 Market Street" /></div>
                  </>
                ) : (
                  <div><Label htmlFor="rn">Full name</Label><Input id="rn" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
                )}
                <div><Label htmlFor="re">Email</Label><Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
                <div><Label htmlFor="rp">Password</Label><Input id="rp" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1.5" /></div>
                <Button type="submit" size="lg" className="w-full rounded-full">Create account</Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo authentication — no real password is stored.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center p-12 bg-gradient-deep relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 bg-primary-glow/30 blur-3xl rounded-full" />
        <div className="relative max-w-md text-primary-foreground">
          <h2 className="font-display font-bold text-4xl leading-tight">Healthcare, simplified.</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Order medicines, upload prescriptions, and track delivery in real time — all in one place.
          </p>
          <ul className="mt-8 space-y-3">
            {['Search 1000+ verified medicines', 'Upload prescriptions in seconds', 'Live map delivery tracking', '24/7 customer support'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
