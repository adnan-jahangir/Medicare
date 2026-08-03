import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/useAppStore';
import {
  Users, Building2, Pill, ShoppingBag, Trash2, Truck, Check, X,
  ShieldAlert, ShieldCheck, Activity, Clock, ArrowRight, Sparkles, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.data.stats);
          setRecentOrders(res.data.data.recentOrders || []);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout role="admin" title="Admin Control Center" subtitle="System-wide metrics, platform user management, and store operations">
      <div className="space-y-8">
        
        {/* Admin Command Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 text-white shadow-xl border border-blue-500/20">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-bold tracking-wide border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Super Administrator Access</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="font-display font-black text-2xl md:text-4xl text-white">
                MedeCare System Status
              </h1>
              <p className="text-sm text-white/70 leading-relaxed">
                All platform servers, database connections, and real-time Socket streams are operating smoothly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0">
                <Link to="/admin/users">
                  <Users className="mr-2 h-4 w-4" /> Manage Users
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold border-white/20 text-white hover:bg-white/10 backdrop-blur">
                <Link to="/admin/pharmacies">
                  <Building2 className="mr-1.5 h-4 w-4 text-blue-300" /> Stores
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-blue-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</span>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {stats?.totalUsers || 0}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-indigo-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pharmacies</span>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {stats?.totalPharmacies || 0}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medicines</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Pill className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {stats?.totalMedicines || 0}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 hover:shadow-md transition-all rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Orders</span>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display font-black text-2xl md:text-3xl text-foreground">
              {stats?.totalOrders || 0}
            </div>
          </Card>
        </div>

        {/* System Activity Stream */}
        <Card className="p-6 border-border/60 rounded-2xl bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-lg text-foreground">System Activity Feed</h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-primary">
              <Link to="/admin/orders">View All Orders <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading system stream...</p>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((o) => (
                <div key={o._id || o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <span className="font-bold text-foreground">Order #{(o._id || o.id || "").slice(-6).toUpperCase()}</span>
                      <span className="text-muted-foreground text-xs ml-2">by {o.customerName || o.customerEmail?.split('@')[0] || 'Customer'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {o.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(o.updatedAt || o.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-muted rounded-xl text-muted-foreground text-sm">
                  No system activity logged yet.
                </div>
              )}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => (u._id || u.id) !== id));
      toast.success('User removed');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  return (
    <DashboardLayout role="admin" title="Users" subtitle="Manage all platform users">
      <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
        {loading ? <div className="p-4 text-sm text-muted-foreground">Loading users...</div> : users.map((u) => (
          <div key={u._id || u.id} className="grid grid-cols-[1fr_120px_100px_60px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary font-bold text-sm flex-shrink-0">{u.name?.charAt(0) || 'U'}</span>
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize w-fit">{u.role}</Badge>
            <Badge className={u.status === 'active' || !u.status ? 'bg-success/15 text-success border border-success/30' : 'bg-destructive/10 text-destructive border border-destructive/30'}>{u.status || 'active'}</Badge>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(u._id || u.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const res = await api.get('/pharmacies');
        if (res.data.success) {
          setPharmacies(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch pharmacies");
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacies();
  }, []);

  return (
    <DashboardLayout role="admin" title="Pharmacies" subtitle="Approved pharmacy partners">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="p-4 text-sm col-span-3 text-muted-foreground">Loading pharmacies...</div> : pharmacies.map((p) => (
          <div key={p._id || p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
              <Badge className="bg-success/15 text-success border border-success/30">Active</Badge>
            </div>
            <h3 className="font-display font-bold text-lg mt-4 truncate">{p.name}</h3>
            <div className="text-sm text-muted-foreground">{p.city} · ⭐ {p.rating}</div>
            <div className="mt-4 pt-4 border-t border-border text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium truncate ml-2">{p.ownerName}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Monthly</span><span className="font-medium tabular-nums"><span className="text-[1.1em]">৳</span>{p.monthlyRevenue?.toLocaleString() || 0}</span></div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminMedicines() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await api.get('/medicines');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setMedicines(list);
      } catch (error) {
        toast.error("Failed to fetch medicines");
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter(m => (m._id || m.id) !== id));
      toast.success('Removed');
    } catch (error) {
      toast.error('Failed to remove medicine');
    }
  };

  return (
    <DashboardLayout role="admin" title="All medicines" subtitle="Across all pharmacies">
      <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
        {loading ? <div className="p-4 text-sm text-muted-foreground">Loading medicines...</div> : medicines.map((m) => {
          return (
            <div key={m._id || m.id} className="grid grid-cols-[1fr_140px_100px_80px_60px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40 min-w-[500px]">
              <div className="flex items-center gap-3 min-w-0">
                <img src={getMedicineImageUrl(m)} alt={m.name} onError={(e) => handleMedicineImgError(e, m)} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0"><div className="font-display font-semibold truncate">{m.name}</div><div className="text-xs text-muted-foreground truncate">{m.strength}</div></div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{m.pharmacyId?.name || 'Unknown'}</div>
              <div className="text-right tabular-nums"><span className="text-[1.1em]">৳</span>{m.price?.toFixed(2)}</div>
              <div className="text-right tabular-nums">{m.stock}</div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id || m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <DashboardLayout role="admin" title="All orders" subtitle="Platform-wide order log">
      <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
        {loading ? <div className="p-4 text-sm text-muted-foreground">Loading orders...</div> : orders.map((o) => {
          return (
            <div key={o._id || o.id} className="grid grid-cols-[1fr_140px_120px_100px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm truncate">{(o._id || o.id || "").slice(-6).toUpperCase()}</div>
                <div className="text-xs text-muted-foreground truncate">{o.customerEmail?.split('@')[0] || o.customerName}</div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{o.pharmacyId?.name || 'Unknown'}</div>
              <Badge variant="outline" className="w-fit">{o.status}</Badge>
              <div className="text-right font-display font-bold tabular-nums"><span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/pending-drivers');
      setDrivers(res.data.data);
    } catch (err) {
      toast.error('Failed to load pending drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, approve: boolean) => {
    try {
      await api.patch(`/admin/approve-driver/${id}`, { approve });
      toast.success(approve ? 'Driver approved!' : 'Driver rejected');
      setDrivers(drivers.filter(d => d._id !== id));
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  return (
    <DashboardLayout role="admin" title="Driver Approvals" subtitle="Verify and approve new delivery partners">
      <div className="space-y-4">
        {loading ? (
          <div className="p-20 text-center text-muted-foreground animate-pulse">Loading queue...</div>
        ) : drivers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No pending approvals</h3>
            <p className="text-muted-foreground">All driver applications have been processed.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {drivers.map(driver => (
              <Card key={driver._id} className="p-6 border-border/60 hover:border-primary/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold text-xl">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{driver.name}</h4>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{driver.vehicleType}</Badge>
                        <Badge variant="outline">{driver.zone}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 overflow-x-auto pb-2 lg:pb-0">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Vehicle Plate</p>
                      <p className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{driver.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">NID Number</p>
                      <p className="text-sm font-semibold">{driver.nidNumber}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      onClick={() => handleApproval(driver._id, false)}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button 
                      className="bg-success hover:bg-success/90"
                      onClick={() => handleApproval(driver._id, true)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
