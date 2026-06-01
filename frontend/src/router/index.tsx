import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const LandingPage = lazy(() => import('../features/landing/pages/LandingPage'));
const StyleGuide = lazy(() => import('../features/style-guide/pages/StyleGuide'));

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
  ...devRoutes,
]);

export default router;
