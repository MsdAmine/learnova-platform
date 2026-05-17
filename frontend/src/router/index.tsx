import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import GuestRoute from '../components/common/GuestRoute';
import DashboardPage from '../pages/DashboardPage';
import RoleGuard from '../components/common/RoleGuard';
import InstructorDashboard from '../features/instructor/pages/InstructorDashboard';
import InstructorCourseCreate from '../features/instructor/pages/InstructorCourseCreate';
import MainLayout from '../layouts/MainLayout';

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/instructor/courses',
        element: (
            <ProtectedRoute>
                <RoleGuard allowedProfile="INSTRUCTOR">
                    <MainLayout>
                        <InstructorDashboard />
                    </MainLayout>
                </RoleGuard>
            </ProtectedRoute>
        ),
    },
    {
        path: '/instructor/courses/create',
        element: (
            <ProtectedRoute>
                <RoleGuard allowedProfile="INSTRUCTOR">
                    <MainLayout>
                        <InstructorCourseCreate />
                    </MainLayout>
                </RoleGuard>
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