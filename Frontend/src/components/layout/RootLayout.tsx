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
    api.get('/medicines')
      .then(res => {
        const rawList = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : []);
        const mapped = rawList.map((m: any) => ({ ...m, id: m._id || m.id }));
        setMedicines(mapped);
      })
      .catch((err) => {
        console.error('Failed to fetch medicines:', err);
        setMedicines([]);
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
