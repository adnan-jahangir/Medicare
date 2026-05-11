import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { ReactNode } from 'react';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default RequireAuth;
