import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { GuestRoute } from '../components/common/GuestRoute';

const LandingPage  = lazy(() => import('../features/landing/pages/LandingPage'));
const AuthLayout   = lazy(() => import('../features/auth/components/AuthLayout'));
const LoginPage    = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const StyleGuide   = lazy(() => import('../features/style-guide/pages/StyleGuide'));

const devRoutes = import.meta.env.DEV
  ? [{ path: '/style-guide', element: <Suspense fallback={null}><StyleGuide /></Suspense> }]
  : [];

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    element: (
      <GuestRoute>
        <Suspense fallback={null}>
          <AuthLayout />
        </Suspense>
      </GuestRoute>
    ),
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={null}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={null}>
            <RegisterPage />
          </Suspense>
        ),
      },
    ],
  },
  ...devRoutes,
]);

export default router;
