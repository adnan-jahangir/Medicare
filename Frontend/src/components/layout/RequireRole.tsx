import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { ReactNode } from 'react';
import type { Role } from '@/lib/types';

export const RequireRole = ({ children, role }: { children: ReactNode; role: Role | Role[] }) => {
  const { user } = useAppStore();
  const allowed = Array.isArray(role) ? role : [role];
  if (!user) return <Navigate to="/login" replace />;
  if (!user?.role || !allowed.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RequireRole;
