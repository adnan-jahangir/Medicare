import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, User, Phone, MapPin, Truck, Shield, Lock, LogOut, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function UpdateProfilePage() {
  const { user, updateUser, logout } = useAppStore();
  const nav = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [address, setAddress] = useState((user as any)?.address || user?.houseLocation || '');

  // Driver fields
  const [vehicleType, setVehicleType] = useState((user as any)?.vehicleType || 'Motorbike');
  const [licensePlate, setLicensePlate] = useState((user as any)?.licensePlate || '');
  const [nidNumber, setNidNumber] = useState((user as any)?.nidNumber || '');
  const [zone, setZone] = useState((user as any)?.zone || '');

  // Shop Owner fields
  const [shopName, setShopName] = useState((user as any)?.shopName || '');
  const [shopCode, setShopCode] = useState((user as any)?.shopCode || '');
  const [shopLocation, setShopLocation] = useState((user as any)?.shopLocation || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phoneNumber ?? '');
      setAddress((user as any)?.address || user.houseLocation || '');
      setVehicleType((user as any)?.vehicleType || 'Motorbike');
      setLicensePlate((user as any)?.licensePlate || '');
      setNidNumber((user as any)?.nidNumber || '');
      setZone((user as any)?.zone || '');
      setShopName((user as any)?.shopName || '');
      setShopCode((user as any)?.shopCode || '');
      setShopLocation((user as any)?.shopLocation || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name,
        email,
        phoneNumber: phone,
        address,
      };

      if (user?.role === 'driver') {
        payload.vehicleType = vehicleType;
        payload.licensePlate = licensePlate;
        payload.nidNumber = nidNumber;
        payload.zone = zone;
      }

      if (user?.role === 'owner') {
        payload.shopName = shopName;
        payload.shopCode = shopCode;
        payload.shopLocation = shopLocation;
      }

      const res = await api.patch('/users/profile', payload);

      if (res.data.success) {
        updateUser(res.data.data);
        toast.success('Profile information updated successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.patch('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    nav('/login');
  };

  return (
    <DashboardLayout role={(user?.role as any) ?? 'customer'} title="Account Settings" subtitle="Manage your profile, security, and account preferences">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* User Badge Overview Card */}
        <Card className="p-6 border-none bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white shadow-lg rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name || 'User Profile'}</h2>
              <p className="text-xs text-white/80">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[11px] font-bold uppercase tracking-wider">
                <Shield className="h-3 w-3" /> {user?.role || 'Customer'}
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Profile Info Form */}
        <Card className="p-6 border-border/60 rounded-2xl bg-card shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg border-b border-border/50 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Personal Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 rounded-xl" />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801712345678" className="mt-1 rounded-xl" />
              </div>

              <div>
                <Label htmlFor="address" className="text-xs font-semibold">Address / Delivery Location</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. House 12, Road 4, Chittagong" className="mt-1 rounded-xl" />
              </div>
            </div>

            {/* Courier info for Drivers */}
            {user?.role === 'driver' && (
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" /> Driver & Courier Details
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Vehicle Type</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bicycle">Bicycle</SelectItem>
                        <SelectItem value="Motorbike">Motorbike</SelectItem>
                        <SelectItem value="Scooter">Scooter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="licensePlate" className="text-xs font-semibold">Vehicle Plate Number</Label>
                    <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="CTG-HA-1234" className="mt-1 rounded-xl font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zone" className="text-xs font-semibold">Delivery Zone</Label>
                    <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="GEC Circle, Chittagong" className="mt-1 rounded-xl" />
                  </div>

                  <div>
                    <Label htmlFor="nidNumber" className="text-xs font-semibold">NID Number</Label>
                    <Input id="nidNumber" value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="NID Number" className="mt-1 rounded-xl font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Shop Info for Owners */}
            {user?.role === 'owner' && (
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" /> Pharmacy Store Details
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shopName" className="text-xs font-semibold">Shop Name</Label>
                    <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="GreenLeaf Pharmacy" className="mt-1 rounded-xl" />
                  </div>

                  <div>
                    <Label htmlFor="shopCode" className="text-xs font-semibold">Shop Code</Label>
                    <Input id="shopCode" value={shopCode} onChange={(e) => setShopCode(e.target.value)} placeholder="GLP-1024" className="mt-1 rounded-xl font-mono" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shopLocation" className="text-xs font-semibold">Shop Address / Location</Label>
                  <Input id="shopLocation" value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} placeholder="GEC, Chittagong" className="mt-1 rounded-xl" />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Info
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 border-border/60 rounded-2xl bg-card shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg border-b border-border/50 pb-3 flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" /> Security & Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="cp" className="text-xs font-semibold">Current Password</Label>
              <Input id="cp" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np" className="text-xs font-semibold">New Password</Label>
                <Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 rounded-xl" />
              </div>

              <div>
                <Label htmlFor="cnp" className="text-xs font-semibold">Confirm New Password</Label>
                <Input id="cnp" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 rounded-xl" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="outline" disabled={changingPassword} className="rounded-xl font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Logout Section */}
        <Card className="p-6 border-destructive/30 rounded-2xl bg-destructive/5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-destructive">Sign Out</h4>
            <p className="text-xs text-muted-foreground">Log out of your MediCare account on this device</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="rounded-xl font-bold">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </Card>

      </div>
    </DashboardLayout>
  );
}