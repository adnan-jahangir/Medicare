import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { Building2, Pill, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import DriverRegistrationForm from '@/components/driver/DriverRegistrationForm';
import { useGoogleLogin } from '@react-oauth/google';

// Custom Google SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const PANEL_OPTIONS = [
  { id: 'customer', label: 'Customer', description: 'Browse medicines, place orders, and track delivery', icon: User, path: '/dashboard' },
  { id: 'driver', label: 'Driver', description: 'Manage deliveries, view routes, and update order status', icon: Pill, path: '/driver' },
] as const;

export default function LoginPage() {
  const { setAuth, setRole, user } = useAppStore();
  const nav = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') nav('/admin');
      else if (user.role === 'owner') nav('/owner');
      else if (user.role === 'driver') nav('/driver');
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
  const [shopLicense, setShopLicense] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          payload.shopLicense = shopLicense;
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
        res = await api.post('/auth/login', { email, password: pwd });
      }

      const authData = res.data?.data ?? res.data;
      if (!authData || !authData.token) {
        toast.error(res.data?.message || 'Authentication failed. Please check credentials.');
        return;
      }
      setAuth(authData, authData.token);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created');
      
      const targetRole = authData.role || 'customer';
      if (targetRole === 'admin') nav('/admin');
      else if (targetRole === 'owner') nav('/owner');
      else if (targetRole === 'driver') nav('/driver');
      else nav('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await api.post('/auth/google', { token: codeResponse.access_token });
        const authData = res.data?.data ?? res.data;
        if (!authData || !authData.token) {
          toast.error('Google login failed on server');
          return;
        }
        setAuth(authData, authData.token);
        toast.success('Welcome back!');
        const targetRole = authData.role || 'customer';
        if (targetRole === 'admin') nav('/admin');
        else if (targetRole === 'owner') nav('/owner');
        else if (targetRole === 'driver') nav('/driver');
        else nav('/dashboard');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Google Authentication failed');
      }
    },
    onError: () => toast.error('Google Sign In failed'),
  });

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
                    Sign in to open your account dashboard. 
                  </p>

                  <form className="space-y-4" onSubmit={(e) => handleSubmit(e, 'login')}>
                    <div>
                      <Label htmlFor="le">Email or Phone Number</Label>
                      <Input
                        id="le"
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5"
                        placeholder="Email or Phone Number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lp">Password</Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="lp"
                          type={showPassword ? "text" : "password"}
                          required
                          value={pwd}
                          onChange={(e) => setPwd(e.target.value)}
                          className="pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-full shadow-sm font-bold">Sign in</Button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground">Or continue with</span></div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="lg" 
                      className="w-full rounded-full border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => loginWithGoogle()}
                    >
                      <GoogleIcon />
                      Sign in with Google
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  {panel === 'driver' ? (
                    <DriverRegistrationForm 
                      onSuccess={() => setPanel('driver')} 
                      onCancel={() => setPanel('customer')} 
                    />
                  ) : (
                    <>
                      <h1 className="font-display font-bold text-3xl">Create account</h1>
                      <p className="text-muted-foreground mt-1 mb-6">
                        {panel === 'owner'
                          ? 'Create a new shop owner account with your pharmacy details.'
                          : 'Create a customer account so we can find the nearest pharmacy faster.'}
                      </p>
                      <form className="space-y-4" onSubmit={(e) => handleSubmit(e, 'register')}>
                        {panel === 'owner' ? (
                          <div className="space-y-5">
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold border-b pb-1 border-border/50 text-foreground/80 uppercase tracking-wide">Personal Data</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="son">Full Name</Label><Input id="son" required value={shopOwnerName} onChange={(e) => setShopOwnerName(e.target.value)} className="mt-1.5" placeholder="Dr. Amelia Cole" /></div>
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="sp">Phone Number</Label><Input id="sp" type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1.5" placeholder="+1 555 123 4567" /></div>
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="re">Email</Label><Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="amelia@example.com" /></div>
                                <div className="col-span-2 sm:col-span-1">
                                  <Label htmlFor="rp">Password</Label>
                                  <div className="relative mt-1.5">
                                    <Input id="rp" type={showPassword ? "text" : "password"} required value={pwd} onChange={(e) => setPwd(e.target.value)} className="pr-10" />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                      aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold border-b pb-1 border-border/50 text-foreground/80 uppercase tracking-wide">Pharmacy Data</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="sc">Shop Code</Label><Input id="sc" required value={shopCode} onChange={(e) => setShopCode(e.target.value)} className="mt-1.5" placeholder="GLP-1024" /></div>
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="sn">Shop Name</Label><Input id="sn" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="mt-1.5" placeholder="GreenLeaf Pharmacy" /></div>
                                <div className="col-span-2 sm:col-span-1"><Label htmlFor="slic">Shop License</Label><Input id="slic" required value={shopLicense} onChange={(e) => setShopLicense(e.target.value)} className="mt-1.5" placeholder="LIC-987654321" /></div>
                                <div className="col-span-2"><Label htmlFor="sl">Shop Location</Label><Input id="sl" required value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} className="mt-1.5" placeholder="New York, NY" /></div>
                              </div>
                            </div>
                            <Button type="submit" size="lg" className="w-full rounded-full mt-4 font-bold">Create account</Button>
                          </div>
                        ) : (
                          <>
                            {panel === 'customer' && (
                              <>
                                <div><Label htmlFor="rn">Full name</Label><Input id="rn" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="John Carter" /></div>
                                <div><Label htmlFor="cp">Phone number</Label><Input id="cp" type="tel" required value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} className="mt-1.5" placeholder="+1 555 987 6543" /></div>
                                <div><Label htmlFor="hl">House location</Label><Input id="hl" required value={houseLocation} onChange={(e) => setHouseLocation(e.target.value)} className="mt-1.5" placeholder="Apt 4B, 12 Market Street" /></div>
                              </>
                            )}
                            {panel === 'admin' && (
                              <>
                                {/* Admin usually doesn't register via this form but if they do, just standard fields. */}
                              </>
                            )}
                            <div><Label htmlFor="re">Email</Label><Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
                            <div>
                              <Label htmlFor="rp">Password</Label>
                              <div className="relative mt-1.5">
                                <Input id="rp" type={showPassword ? "text" : "password"} required value={pwd} onChange={(e) => setPwd(e.target.value)} className="pr-10" />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <Button type="submit" size="lg" className="w-full rounded-full shadow-sm font-bold">Create account</Button>
                            
                            <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground">Or continue with</span></div>
                            </div>
                            
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="lg" 
                              className="w-full rounded-full border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              onClick={() => loginWithGoogle()}
                            >
                              <GoogleIcon />
                              Sign up with Google
                            </Button>
                          </>
                        )}
                      </form>
                    </>
                  )}
                </TabsContent>
              </Tabs>


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
