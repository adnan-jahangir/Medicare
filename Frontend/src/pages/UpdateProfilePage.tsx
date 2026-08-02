import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function UpdateProfilePage() {
  const { user, updateUser } = useAppStore();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        name,
        email,
        phoneNumber: phone,
      };
      if (password) {
        payload.password = password;
      }

      const res = await api.patch('/users/profile', payload);

      if (res.data.success) {
        updateUser(res.data.data);
        toast.success('Profile updated successfully!');
        setPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role={(user?.role as any) ?? 'customer'} title="Update Profile" subtitle="Manage your personal information">
      <section className="rounded-2xl border border-border bg-card p-6 max-w-xl">
        <form onSubmit={handleUpdate} className="space-y-4">
          
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="password">New Password (optional)</Label>
            <Input id="password" type="password" placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="picture">Profile Picture (optional)</Label>
            <Input id="picture" type="file" accept="image/*" />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}