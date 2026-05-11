import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PrescriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Prescription submitted', { description: "Our pharmacist will review it shortly." });
  };

  if (submitted) {
    return (
      <div className="container max-w-xl py-20 text-center">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-success/15 text-success mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-display font-bold text-3xl">Prescription received</h2>
        <p className="text-muted-foreground mt-2">A licensed pharmacist will verify your prescription within 15 minutes and contact you.</p>
        <Button className="mt-6 rounded-full" onClick={() => setSubmitted(false)}>Upload another</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="font-display font-bold text-3xl md:text-4xl">Upload prescription</h1>
      <p className="text-muted-foreground mt-2">Get prescription medicines delivered fast. Your data is private and secure.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label>Prescription file</Label>
          <label
            htmlFor="rx"
            className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}`}
          >
            {file ? (
              <>
                <FileText className="h-10 w-10 text-primary" />
                <span className="mt-3 font-display font-semibold">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · click to replace</span>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <span className="mt-3 font-display font-semibold">Click to upload</span>
                <span className="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</span>
              </>
            )}
            <input id="rx" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="pn">Patient name</Label><Input id="pn" required className="mt-1.5" /></div>
          <div><Label htmlFor="pp">Phone</Label><Input id="pp" required className="mt-1.5" /></div>
        </div>
        <div><Label htmlFor="notes">Additional notes</Label><Textarea id="notes" className="mt-1.5" placeholder="Any allergies or special instructions…" /></div>

        <Button type="submit" size="lg" className="w-full rounded-full">Submit prescription</Button>
      </form>
    </div>
  );
}
