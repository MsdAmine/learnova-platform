import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GuestRouteProps {
    children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}