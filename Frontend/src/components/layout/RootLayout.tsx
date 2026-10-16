import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallAppBanner } from '../InstallAppBanner';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export const RootLayout = () => {
  const { setMedicines } = useAppStore();

  useEffect(() => {
    // Send background wake-up ping if backend is idling on Render
    api.get('/status').catch(() => {});

    // Stale-While-Revalidate: fetch fresh medicines in background without blocking initial render
    api.get('/medicines')
      .then(res => {
        const rawList = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : []);
        if (rawList.length > 0) {
          const mapped = rawList.map((m: any) => ({
            ...m,
            id: m._id || m.id,
            prescriptionRequired: m.prescriptionRequired ?? m.requires_prescription ?? false,
            image: m.image || m.image_url || m.imageUrl || '/placeholder.svg',
          }));
          setMedicines(mapped);
        }
      })
      .catch((err) => {
        // Keep cached/default medicines intact if network fails or server cold start takes time
        console.warn('Backend waking up or network unavailable, serving cached medicines:', err?.message || err);
      });
  }, [setMedicines]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstallAppBanner />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};
