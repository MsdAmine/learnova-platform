import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

export function InstructorRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.availableProfiles.includes('INSTRUCTOR')) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
