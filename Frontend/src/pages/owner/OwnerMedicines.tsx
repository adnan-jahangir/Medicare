import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Plus, Pencil, Trash2, Search, Filter, LayoutGrid, List,
  AlertTriangle, CheckCircle2, Package, ShieldCheck, Loader2, Pill, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { Medicine, Category } from '@/lib/types';
import api from '@/lib/api';
import { getMedicineImageUrl, handleMedicineImgError } from '@/lib/utils';

const CATS: Category[] = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Diabetes', 'Heart', 'Skin Care'];

const empty: Medicine = {
  id: '', name: '', brand: '', strength: '', dosage: '', description: '',
  category: 'Pain Relief', price: 0, stock: 0,
  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=70',
  prescriptionRequired: false, pharmacyId: '',
};

export default function OwnerMedicines() {
  const { user } = useAppStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/medicines?pharmacyId=${user?.shopCode || ''}`);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setMedicines(list);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditing({ ...empty, pharmacyId: user?.shopCode || '' } as any);
    setOpen(true);
  };

  const startEdit = (m: Medicine) => {
    setEditing({ ...m });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Medicine name is required'); return; }
    if (editing.price <= 0) { toast.error('Please set a valid price'); return; }

    try {
      const isUpdating = !!(editing as any)._id;
      
      if (isUpdating) {
        await api.patch(`/medicines/${(editing as any)._id}`, editing);
        toast.success(`'${editing.name}' updated!`);
      } else {
        await api.post('/medicines', { ...editing, pharmacyId: user?.shopCode });
        toast.success(`'${editing.name}' added to inventory!`);
      }
      
      setOpen(false);
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save medicine');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine removed');
      fetchMedicines();
    } catch (error) {
      toast.error('Failed to delete medicine');
    }
  };

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        m.name.toLowerCase().includes(q) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.strength && m.strength.toLowerCase().includes(q))
      );
      return matchCat && matchSearch;
    });
  }, [medicines, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <DashboardLayout role="owner" title="Medicine Inventory" subtitle="Manage your pharmacy catalog">
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Fetching inventory records…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner" title="Medicine Inventory" subtitle="Manage your stock, pricing, and prescription requirements">
      <div className="space-y-6">

        {/* Top Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, brand, strength…"
                className="pl-9 h-10 rounded-xl bg-background text-xs"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl bg-background text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="h-8 px-3 rounded-lg text-xs font-bold">
              {filteredMedicines.length} SKU{filteredMedicines.length !== 1 && 's'}
            </Badge>
          </div>

          {/* View Toggles & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'grid' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'table' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={startNew}
              className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 h-10"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Medicine
            </Button>
          </div>
        </div>

        {/* Inventory Display */}
        {viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedicines.map((m: any) => (
              <Card
                key={m._id || m.id}
                className="p-4 border-border/70 hover:shadow-lg hover:border-primary/40 transition-all rounded-2xl flex flex-col justify-between bg-card group relative overflow-hidden"
              >
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted mb-3">
                    <img
                      src={getMedicineImageUrl(m)}
                      alt={m.name}
                      onError={(e) => handleMedicineImgError(e, m)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="text-[10px] backdrop-blur bg-background/80 font-semibold">
                        {m.category}
                      </Badge>
                      {m.prescriptionRequired && (
                        <Badge className="text-[10px] bg-purple-600 text-white font-bold">
                          Rx
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {m.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.brand} • {m.strength || m.dosage}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <div className="font-display font-black text-lg text-primary tabular-nums">
                      <span className="text-[1.1em]">৳</span>{m.price.toFixed(2)}
                    </div>
                    <div className={`text-[11px] font-bold ${
                      m.stock === 0 ? 'text-red-600' : m.stock < 50 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {m.stock} pcs in stock
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(m)}
                      className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m._id || m.id, m.name)}
                      className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-[1.5fr_120px_100px_100px_120px_100px] gap-4 px-6 py-3 text-xs uppercase font-bold tracking-wider text-muted-foreground border-b border-border bg-muted/30">
              <div>Medicine</div>
              <div>Category</div>
              <div className="text-right">Price</div>
              <div className="text-right">Stock</div>
              <div className="text-center">Prescription</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-border/60">
              {filteredMedicines.map((m: any) => (
                <div
                  key={m._id || m.id}
                  className="grid md:grid-cols-[1.5fr_120px_100px_100px_120px_100px] gap-4 items-center px-6 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getMedicineImageUrl(m)}
                      alt={m.name}
                      onError={(e) => handleMedicineImgError(e, m)}
                      className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-sm truncate text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.brand} • {m.strength || m.dosage}</div>
                    </div>
                  </div>

                  <div>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {m.category}
                    </Badge>
                  </div>

                  <div className="text-right font-display font-bold text-sm tabular-nums">
                    <span className="text-[1.1em]">৳</span>{m.price.toFixed(2)}
                  </div>

                  <div className={`text-right font-mono font-medium text-xs tabular-nums ${
                    m.stock === 0 ? 'text-red-600 font-bold' : m.stock < 50 ? 'text-amber-600 font-bold' : 'text-foreground'
                  }`}>
                    {m.stock} pcs
                  </div>

                  <div className="text-center">
                    {m.prescriptionRequired ? (
                      <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/30 text-[10px] font-bold">
                        Rx Required
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs font-medium">OTC</span>
                    )}
                  </div>

                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(m)} className="h-8 w-8 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id || m.id, m.name)} className="h-8 w-8 rounded-lg text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredMedicines.length === 0 && (
          <div className="p-16 text-center border-2 border-dashed border-muted rounded-3xl space-y-3 bg-card">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Pill className="h-7 w-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">No medicines found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery ? `No items matched your search query "${searchQuery}"` : 'No medicines in this category yet.'}
            </p>
            <Button onClick={startNew} className="rounded-full mt-2">
              <Plus className="h-4 w-4 mr-1" /> Add First Medicine
            </Button>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                {editing && (editing as any)._id ? 'Edit Medicine' : 'Add New Medicine'}
              </DialogTitle>
            </DialogHeader>

            {editing && (
              <div className="space-y-4 py-2">
                
                {/* Image Preview */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
                  <img
                    src={editing.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae'}
                    alt="Preview"
                    className="h-16 w-16 rounded-xl object-cover bg-background border border-border"
                    onError={(e) => handleMedicineImgError(e, editing)}
                  />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs font-semibold">Image URL</Label>
                    <Input
                      value={editing.image}
                      onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 h-9 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Medicine Name *</Label>
                    <Input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      placeholder="e.g. Napa Extra"
                      className="mt-1 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Brand / Manufacturer</Label>
                    <Input
                      value={editing.brand}
                      onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                      placeholder="e.g. Beximco Pharma"
                      className="mt-1 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Strength / Power</Label>
                    <Input
                      value={editing.strength}
                      onChange={(e) => setEditing({ ...editing, strength: e.target.value })}
                      placeholder="e.g. 500mg + 65mg"
                      className="mt-1 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Category</Label>
                    <Select
                      value={editing.category}
                      onValueChange={(v) => setEditing({ ...editing, category: v as Category })}
                    >
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Price per unit (৳) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Stock Quantity (PCS) *</Label>
                    <Input
                      type="number"
                      value={editing.stock}
                      onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })}
                      className="mt-1 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold">Dosage Instructions / Usage</Label>
                    <Input
                      value={editing.dosage}
                      onChange={(e) => setEditing({ ...editing, dosage: e.target.value })}
                      placeholder="e.g. 1 tablet after food 3 times daily"
                      className="mt-1 rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      placeholder="Medicine details, side effects, precautions..."
                      className="mt-1 rounded-xl text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
                    <div>
                      <Label htmlFor="rx-req" className="font-semibold text-sm cursor-pointer">
                        Prescription Required (Rx)
                      </Label>
                      <p className="text-xs text-muted-foreground">Require customer to upload valid doctor prescription</p>
                    </div>
                    <Switch
                      id="rx-req"
                      checked={editing.prescriptionRequired}
                      onCheckedChange={(v) => setEditing({ ...editing, prescriptionRequired: v })}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={save} className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                    Save Medicine
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}

