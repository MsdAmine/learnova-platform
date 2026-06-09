import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setupApiInterceptors } from '../../api/axios';

const AUTH_ROUTES = new Set(['/login', '/register']);

export function ApiInterceptorSetup() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        return setupApiInterceptors({
            onUnauthorized: () => {
                logout();
                // Read window.location.pathname at callback time (API response),
                // not at render time, so no ref or location dep is needed.
                if (!AUTH_ROUTES.has(window.location.pathname)) {
                    navigate('/login', { replace: true });
                }
            },
            onForbidden: () => {
                navigate('/unauthorized', { replace: true });
            },
        });
    }, [logout, navigate]);

    return null;
}
