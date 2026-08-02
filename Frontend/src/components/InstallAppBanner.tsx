import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('MediCare App Installed!');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Manual instructions fallback for Safari / browsers without beforeinstallprompt
      toast.info('To install MediCare: Tap Share or Browser Menu (...) and select "Add to Home Screen"');
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-2 flex items-center justify-between shadow-md text-xs sm:text-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 font-medium">
        <Smartphone className="h-4 w-4 animate-bounce text-teal-200" />
        <span>Install <strong>MediCare App</strong> for a faster, full-screen mobile experience</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstallClick}
          className="rounded-full h-8 text-xs font-bold bg-white text-teal-800 hover:bg-teal-50"
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Install App
        </Button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-white/80 hover:text-white transition-colors"
          aria-label="Close app banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
