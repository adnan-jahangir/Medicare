import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User, Truck, ShieldCheck, ArrowRight, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface DriverRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DriverRegistrationForm({ onSuccess, onCancel }: DriverRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    zone: '',
    vehicleType: 'Bicycle',
    licensePlate: '',
    nidNumber: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { phone, ...rest } = formData;
      await api.post('/auth/register', {
        ...rest,
        role: 'driver',
        phoneNumber: phone,
      });
      toast.success('Registration submitted! Please wait for admin approval.');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Personal Info', icon: User },
    { title: 'Vehicle Info', icon: Truck },
    { title: 'Legal', icon: ShieldCheck },
  ];

  return (
    <Card className="p-6 shadow-xl border-primary/20 bg-card/90 backdrop-blur-sm">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((s, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 ${step > i ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${step > i ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{s.title}</span>
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-1" />
      </div>

      <div className="space-y-4 min-h-[300px]">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+88017xxxxxxxx" />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Current Address</Label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Street, City" />
            </div>
            <div className="grid gap-2">
              <Label>Preferred Zone</Label>
              <Input value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} placeholder="Dhaka North" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-2">
              <Label>Vehicle Type</Label>
              <Select value={formData.vehicleType} onValueChange={v => setFormData({ ...formData, vehicleType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bicycle">Bicycle</SelectItem>
                  <SelectItem value="Motorbike">Motorbike</SelectItem>
                  <SelectItem value="Scooter">Scooter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.vehicleType === 'Motorbike' || formData.vehicleType === 'Scooter') && (
              <div className="grid gap-2">
                <Label>License Plate Number</Label>
                <Input value={formData.licensePlate} onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} placeholder="DHA-META-12-3456" />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-2">
              <Label>NID Number</Label>
              <Input value={formData.nidNumber} onChange={e => setFormData({ ...formData, nidNumber: e.target.value })} placeholder="199XXXXXXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed rounded-xl p-4 text-center space-y-2 hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-[10px] uppercase font-bold text-muted-foreground">NID Front</p>
              </div>
              <div className="border-2 border-dashed rounded-xl p-4 text-center space-y-2 hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-[10px] uppercase font-bold text-muted-foreground">NID Back</p>
              </div>
            </div>
            <div className="border-2 border-dashed rounded-xl p-4 text-center space-y-2 hover:bg-muted/50 cursor-pointer transition-colors">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Driving License</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <Button variant="ghost" onClick={prevStep} disabled={loading}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        ) : (
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
        
        {step < 3 ? (
          <Button onClick={nextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-success hover:bg-success/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Registration'}
          </Button>
        )}
      </div>
    </Card>
  );
}
