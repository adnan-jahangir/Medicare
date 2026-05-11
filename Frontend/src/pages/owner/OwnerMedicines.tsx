import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Medicine, Category } from '@/lib/types';
import api from '@/lib/api';

const CATS: Category[] = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Diabetes', 'Heart', 'Skin Care'];

const empty: Medicine = {
  id: '', name: '', brand: '', strength: '', dosage: '', description: '',
  category: 'Pain Relief', price: 0, stock: 0,
  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=70',
  prescriptionRequired: false, pharmacyId: 'ph_1',
};

export default function OwnerMedicines() {
  const { user } = useAppStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      // In a real app we'd filter by the owner's actual pharmacyId
      const { data } = await api.get('/medicines');
      setMedicines(data);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => { setEditing({ ...empty, id: '', _id: '' } as any); setOpen(true); };
  const startEdit = (m: Medicine) => { setEditing({ ...m }); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Name is required'); return; }

    try {
      const isUpdating = !!(editing as any)._id;
      
      if (isUpdating) {
        await api.patch(`/medicines/${(editing as any)._id}`, editing);
        toast.success('Medicine updated');
      } else {
        // Mock pharmacyId for the time being until we bind user to a real pharmacy schema.
        await api.post('/medicines', { ...editing, pharmacyId: "647f11122233344455566677" });
        toast.success('Medicine added');
      }
      
      setOpen(false);
      fetchMedicines(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine deleted');
      fetchMedicines(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <DashboardLayout role="owner" title="Medicines" subtitle="Manage your inventory"><div>Loading medicines...</div></DashboardLayout>;

  return (
    <DashboardLayout role="owner" title="Medicines" subtitle="Manage your inventory">
      <div className="flex justify-end mb-4">
        <Button onClick={startNew} className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Add medicine</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_140px_120px] gap-4 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <div>Medicine</div><div>Category</div><div className="text-right">Price</div><div className="text-right">Stock</div><div className="text-center">Rx required</div><div className="text-right">Actions</div>
        </div>
        {medicines.map((m: any) => (
          <div key={m._id} className="grid md:grid-cols-[1fr_120px_100px_100px_140px_120px] gap-4 items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <img src={m.image} alt={m.name} className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="font-display font-semibold truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.brand} · {m.strength}</div>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit">{m.category}</Badge>
            <div className="text-right tabular-nums">${m.price.toFixed(2)}</div>
            <div className={`text-right font-medium tabular-nums ${m.stock === 0 ? 'text-destructive' : m.stock < 50 ? 'text-warning' : 'text-foreground'}`}>{m.stock}</div>
            <div className="text-center">{m.prescriptionRequired ? <Badge className="bg-warning/15 text-warning-foreground border border-warning/30">Required</Badge> : <span className="text-muted-foreground text-xs">No</span>}</div>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(m)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing && medicines.some((x) => x.id === editing.id) ? 'Edit medicine' : 'Add medicine'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Brand</Label><Input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Strength</Label><Input value={editing.strength} onChange={(e) => setEditing({ ...editing, strength: e.target.value })} className="mt-1.5" placeholder="500mg" /></div>
              <div className="sm:col-span-2"><Label>Dosage</Label><Input value={editing.dosage} onChange={(e) => setEditing({ ...editing, dosage: e.target.value })} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1.5" /></div>
              <div>
                <Label>Category</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as Category })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price</Label><Input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="mt-1.5" /></div>
                <div><Label>Stock</Label><Input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} className="mt-1.5" /></div>
              </div>
              <div className="sm:col-span-2"><Label>Image URL</Label><Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="mt-1.5" /></div>
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg border border-border">
                <Label htmlFor="rx-req">Requires prescription</Label>
                <Switch id="rx-req" checked={editing.prescriptionRequired} onCheckedChange={(v) => setEditing({ ...editing, prescriptionRequired: v })} />
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
