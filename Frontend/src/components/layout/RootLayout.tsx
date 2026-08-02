import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { InstallAppBanner } from '../InstallAppBanner';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export const RootLayout = () => {
  const { setMedicines } = useAppStore();

  useEffect(() => {
    api.get('/medicines')
      .then(res => {
        // Map _id to id so frontend doesn't break
        const mapped = res.data.map((m: any) => ({ ...m, id: m._id }));
        setMedicines(mapped);
      })
      .catch(console.error);
  }, [setMedicines]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstallAppBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
