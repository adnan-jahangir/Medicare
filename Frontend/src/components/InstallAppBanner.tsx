import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Check if user dismissed banner recently
    const dismissed = localStorage.getItem('medicare-app-banner-dismissed');
    if (!dismissed) {
      setShowPrompt(true);
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
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('MediCare App Installed successfully!');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (err) {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('medicare-app-banner-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md text-xs sm:text-sm animate-in slide-in-from-top duration-300 relative z-40">
        <div className="flex items-center gap-2 font-medium min-w-0 pr-2">
          <Smartphone className="h-4 w-4 shrink-0 animate-bounce text-teal-200" />
          <span className="truncate">Install <strong>MediCare App</strong> on your phone for 1-click access</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstallClick}
            className="rounded-full h-8 text-xs font-bold bg-white text-teal-800 hover:bg-teal-50 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Install
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/80 hover:text-white transition-colors"
            aria-label="Close app banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Manual Installation Instructions Dialog for iOS & Non-Chrome browsers */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700">
              <Smartphone className="h-5 w-5" /> Install MediCare App
            </DialogTitle>
            <DialogDescription>
              Follow these simple steps to add MediCare to your home screen:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {isIOS ? (
              <ol className="list-decimal list-inside space-y-2 text-foreground/90">
                <li>Tap the <strong>Share</strong> button <Share className="inline h-4 w-4 text-primary" /> at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2 text-foreground/90">
                <li>Tap the <strong>3 dots menu (⋮)</strong> at the top right of your browser.</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Confirm to install MediCare on your phone!</li>
              </ol>
            )}
          </div>

          <Button onClick={() => setShowInstructions(false)} className="w-full">Got it!</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

