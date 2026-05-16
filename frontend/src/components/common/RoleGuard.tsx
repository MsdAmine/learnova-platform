import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ProfileType } from '../../types/profile';
import type { ReactNode } from 'react';

interface RoleGuardProps {
    children: ReactNode;
    allowedProfile: ProfileType;
}

export default function RoleGuard({ children, allowedProfile }: RoleGuardProps) {
    const { activeProfile, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (activeProfile !== allowedProfile) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
