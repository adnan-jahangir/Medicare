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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setUsers(list);
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
      setUsers(prev => prev.filter(u => (u._id || u.id) !== id));
      toast.success('User removed');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
    return matchRole && matchQuery;
  });

  return (
    <DashboardLayout role="admin" title="Users Management" subtitle="Manage all platform accounts & credentials">
      <div className="space-y-6">

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto p-1 no-scrollbar">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'customer', label: 'Customers' },
              { id: 'owner', label: 'Owners' },
              { id: 'driver', label: 'Drivers' },
              { id: 'admin', label: 'Admins' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading users list...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-sm">
            No users found matching filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u._id || u.id} className="p-4 sm:p-5 border-border/70 hover:shadow-md transition-all rounded-2xl bg-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary font-display font-black text-base flex-shrink-0 shadow-inner">
                      {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-base text-foreground truncate">{u.name || 'User'}</span>
                        <Badge variant="outline" className="capitalize text-[10px] font-bold px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                          {u.role}
                        </Badge>
                        <Badge className={`text-[10px] font-bold ${
                          u.status === 'active' || !u.status 
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' 
                            : 'bg-red-500/10 text-red-600 border border-red-500/30'
                        }`}>
                          {u.status || 'active'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(u._id || u.id)}
                    className="h-10 w-10 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title="Delete User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="p-12 text-center col-span-full text-muted-foreground animate-pulse">Loading pharmacies...</div>
        ) : pharmacies.map((p) => (
          <Card key={p._id || p.id} className="rounded-2xl border border-border/70 bg-card p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-bold">Active</Badge>
            </div>
            <h3 className="font-display font-bold text-lg mt-4 truncate">{p.name}</h3>
            <div className="text-sm text-muted-foreground">{p.city} · ⭐ {p.rating}</div>
            <div className="mt-4 pt-4 border-t border-border/60 text-sm space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-semibold text-foreground truncate ml-2">{p.ownerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Monthly Revenue</span>
                <span className="font-bold text-primary tabular-nums"><span className="text-[1.1em]">৳</span>{p.monthlyRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminMedicines() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMedicines = medicines.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.strength && m.strength.toLowerCase().includes(q)) ||
      (m.pharmacyId?.name && m.pharmacyId.name.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout role="admin" title="All Medicines" subtitle="System-wide medicine catalog across all pharmacies">
      <div className="space-y-6">

        {/* Search Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicine name or pharmacy..."
              className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Badge variant="secondary" className="h-8 px-3 rounded-lg text-xs font-bold">
            {filteredMedicines.length} Medicines
          </Badge>
        </div>

        {/* Medicines List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading medicines...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-sm">
            No medicines found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMedicines.map((m) => (
              <Card key={m._id || m.id} className="p-4 rounded-2xl border border-border/70 bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={getMedicineImageUrl(m)}
                      alt={m.name}
                      onError={(e) => handleMedicineImgError(e, m)}
                      className="h-11 w-11 rounded-xl object-cover bg-muted flex-shrink-0 border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-base truncate text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.strength || m.brand} • {m.pharmacyId?.name || 'Pharmacy'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-display font-bold text-base text-primary tabular-nums">
                        <span className="text-[1.1em]">৳</span>{m.price?.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold ${m.stock < 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {m.stock} in stock
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m._id || m.id)}
                      className="h-9 w-9 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
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

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setOrders(list);
      } catch (error) {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o._id || o.id || '').toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout role="admin" title="All Orders" subtitle="Platform-wide order logs & live tracking">
      <div className="space-y-6">

        {/* Search Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search order ID, customer, status..."
              className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Badge variant="secondary" className="h-8 px-3 rounded-lg text-xs font-bold">
            {filteredOrders.length} Orders
          </Badge>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-sm">
            No orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((o) => (
              <Card key={o._id || o.id} className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-foreground">
                        #{(o._id || o.id || "").slice(-6).toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary border-primary/30">
                        {o.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                      <span>Customer: <strong>{o.customerName || o.customerEmail?.split('@')[0] || 'Customer'}</strong></span>
                      <span>•</span>
                      <span>Store: {o.pharmacyId?.name || 'Pharmacy'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Total</div>
                      <div className="font-display font-bold text-lg text-primary tabular-nums">
                        <span className="text-[1.1em]">৳</span>{(o.total || 0).toFixed(2)}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="rounded-xl border border-border text-xs font-semibold">
                      <Link to={`/orders/${o._id || o.id}`} target="_blank">
                        View Details <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
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

export function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/pending-drivers');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setDrivers(list);
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
      setDrivers(prev => prev.filter(d => d._id !== id && d.id !== id));
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  return (
    <DashboardLayout role="admin" title="Driver Approvals" subtitle="Verify and approve new delivery partner applications">
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground animate-pulse">Loading driver application queue...</div>
        ) : drivers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 rounded-2xl">
            <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg">No pending driver applications</h3>
            <p className="text-sm text-muted-foreground mt-1">All driver accounts are up to date and verified.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {drivers.map(driver => (
              <Card key={driver._id || driver.id} className="p-5 rounded-2xl border-border/70 hover:border-primary/50 transition-all bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-display font-black text-xl shadow-inner">
                      {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-display font-bold text-lg text-foreground truncate">{driver.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{driver.email} • {driver.phoneNumber || 'No Phone'}</p>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] font-bold">{driver.vehicleType || 'Courier'}</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">{driver.zone || 'General Zone'}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                    <div className="text-xs space-y-1 sm:text-right pr-4 border-b sm:border-b-0 sm:border-r border-border/60 pb-2 sm:pb-0 sm:pr-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle Plate</p>
                      <p className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md inline-block">{driver.licensePlate || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 sm:flex-initial text-red-600 hover:bg-red-500/10 border-red-500/30 rounded-xl font-bold"
                        onClick={() => handleApproval(driver._id || driver.id, false)}
                      >
                        <X className="mr-1.5 h-4 w-4" /> Reject
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                        onClick={() => handleApproval(driver._id || driver.id, true)}
                      >
                        <Check className="mr-1.5 h-4 w-4" /> Approve
                      </Button>
                    </div>
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
