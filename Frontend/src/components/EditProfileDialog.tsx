import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Loader2, User, Phone, MapPin, Truck, Shield } from 'lucide-react';
import api from '@/lib/api';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, updateUser } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState((user as any)?.address || user?.houseLocation || '');
  
  // Driver specific
  const [vehicleType, setVehicleType] = useState((user as any)?.vehicleType || 'Motorbike');
  const [licensePlate, setLicensePlate] = useState((user as any)?.licensePlate || '');
  const [nidNumber, setNidNumber] = useState((user as any)?.nidNumber || '');
  const [zone, setZone] = useState((user as any)?.zone || '');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setAddress((user as any)?.address || user.houseLocation || '');
      setVehicleType((user as any)?.vehicleType || 'Motorbike');
      setLicensePlate((user as any)?.licensePlate || '');
      setNidNumber((user as any)?.nidNumber || '');
      setZone((user as any)?.zone || '');
    }
  }, [user, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name,
        phoneNumber,
        address,
      };

      if (user?.role === 'driver') {
        payload.vehicleType = vehicleType;
        payload.licensePlate = licensePlate;
        payload.nidNumber = nidNumber;
        payload.zone = zone;
      }

      const res = await api.patch('/users/profile', payload);

      if (res.data.success) {
        updateUser(res.data.data);
        toast.success('Profile updated successfully!');
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div>
            <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-xl"
              required
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="text-xs font-semibold">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +8801712345678"
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-xs font-semibold">Address / Location</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Chittagong, Bangladesh"
              className="mt-1 rounded-xl"
            />
          </div>

          {/* Driver specific profile fields */}
          {user?.role === 'driver' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" /> Courier Info
              </p>

              <div>
                <Label className="text-xs font-semibold">Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={(val) => setVehicleType(val)}>
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
                <Input
                  id="licensePlate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="e.g. CTG-METRO-HA-1234"
                  className="mt-1 rounded-xl font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="zone" className="text-xs font-semibold">Delivery Zone</Label>
                  <Input
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. GEC Circle"
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="nidNumber" className="text-xs font-semibold">NID Number</Label>
                  <Input
                    id="nidNumber"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    placeholder="NID number"
                    className="mt-1 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
