import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import GuestRoute from '../components/common/GuestRoute';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardPlaceholder />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: (
            <GuestRoute>
                <LoginPage />
            </GuestRoute>
        ),
    },
    {
        path: '/register',
        element: (
            <GuestRoute>
                <RegisterPage />
            </GuestRoute>
        ),
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default router;