/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { GuestRoute } from '../components/common/GuestRoute';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { InstructorRoute } from '../components/common/InstructorRoute';
import { AdminRoute } from '../components/common/AdminRoute';
import { LandingPageSkeleton } from '../components/common/skeletons/LandingPageSkeleton';
import { AuthLayoutSkeleton } from '../components/common/skeletons/AuthLayoutSkeleton';
import { DashboardLayoutSkeleton } from '../components/common/skeletons/DashboardLayoutSkeleton';
import { DashboardPageSkeleton } from '../components/common/skeletons/DashboardPageSkeleton';

const RootLayout       = lazy(() => import('../components/common/RootLayout'));
const LandingPage      = lazy(() => import('../features/landing/pages/LandingPage'));
const CourseCatalogPage = lazy(() => import('../features/catalog/pages/CourseCatalogPage'));
const AuthLayout       = lazy(() => import('../features/auth/components/AuthLayout'));
const LoginPage        = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage     = lazy(() => import('../features/auth/pages/RegisterPage'));
const StyleGuide       = lazy(() => import('../features/style-guide/pages/StyleGuide'));
const UnauthorizedPage = lazy(() => import('../features/errors/pages/UnauthorizedPage'));

const DashboardLayout  = lazy(() => import('../features/dashboard/components/DashboardLayout'));
const LearnerDashboard = lazy(() => import('../features/dashboard/pages/LearnerDashboard'));
const MyCoursesPage    = lazy(() => import('../features/dashboard/pages/MyCoursesPage'));
const ProgressPage     = lazy(() => import('../features/dashboard/pages/ProgressPage'));
const CertificatesPage = lazy(() => import('../features/dashboard/pages/CertificatesPage'));
const LiveSessionsPage = lazy(() => import('../features/dashboard/pages/LiveSessionsPage'));
const SettingsPage     = lazy(() => import('../features/dashboard/pages/SettingsPage'));

const CoursePlayerPage = lazy(() => import('../features/dashboard/pages/CoursePlayerPage'));

const InstructorLayout             = lazy(() => import('../features/instructor/components/InstructorLayout'));
const InstructorCoursesPage        = lazy(() => import('../features/instructor/pages/InstructorCoursesPage'));
const InstructorCourseContentPage  = lazy(() => import('../features/instructor/pages/InstructorCourseContentPage'));

const AdminLayout                    = lazy(() => import('../features/admin/components/AdminLayout'));
const AdminInstructorApprovalsPage   = lazy(() => import('../features/admin/pages/AdminInstructorApprovalsPage'));

const devRoutes = import.meta.env.DEV
  ? [{ path: '/style-guide', element: <Suspense fallback={null}><StyleGuide /></Suspense> }]
  : [];

const router = createBrowserRouter([
  {
    // Pathless root layout — mounts ApiInterceptorSetup once for all routes.
    // No path segment added; all children resolve at their own paths.
    element: (
      <Suspense fallback={null}>
        <RootLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<LandingPageSkeleton />}>
            <LandingPage />
          </Suspense>
        ),
      },
      {
        // Public course catalog — guests must be able to browse; no guard.
        path: '/courses',
        element: (
          <Suspense fallback={null}>
            <CourseCatalogPage />
          </Suspense>
        ),
      },
      {
        element: (
          <GuestRoute>
            <Suspense fallback={<AuthLayoutSkeleton />}>
              <AuthLayout />
            </Suspense>
          </GuestRoute>
        ),
        children: [
          {
            path: '/login',
            element: (
              <Suspense fallback={<AuthLayoutSkeleton />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: '/register',
            element: (
              <Suspense fallback={<AuthLayoutSkeleton />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<DashboardLayoutSkeleton />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <LearnerDashboard />
              </Suspense>
            ),
          },
          {
            path: 'courses',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <MyCoursesPage />
              </Suspense>
            ),
          },
          {
            path: 'courses/:courseId',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <CoursePlayerPage />
              </Suspense>
            ),
          },
          {
            path: 'progress',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <ProgressPage />
              </Suspense>
            ),
          },
          {
            path: 'certificates',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <CertificatesPage />
              </Suspense>
            ),
          },
          {
            path: 'live-sessions',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <LiveSessionsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <SettingsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        // Instructor area — separate shell, not nested under learner DashboardLayout.
        // InstructorRoute checks isAuthenticated + availableProfiles includes INSTRUCTOR.
        path: '/instructor',
        element: (
          <InstructorRoute>
            <Suspense fallback={<DashboardLayoutSkeleton />}>
              <InstructorLayout />
            </Suspense>
          </InstructorRoute>
        ),
        children: [
          {
            path: 'courses',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <InstructorCoursesPage />
              </Suspense>
            ),
          },
          {
            path: 'courses/:courseId/content',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <InstructorCourseContentPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        // Admin area — separate shell, not nested under learner or instructor layouts.
        // AdminRoute checks isAuthenticated + user.roles includes ROLE_ADMIN.
        path: '/admin',
        element: (
          <AdminRoute>
            <Suspense fallback={<DashboardLayoutSkeleton />}>
              <AdminLayout />
            </Suspense>
          </AdminRoute>
        ),
        children: [
          {
            path: 'instructor-approvals',
            element: (
              <Suspense fallback={<DashboardPageSkeleton />}>
                <AdminInstructorApprovalsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/unauthorized',
        element: (
          <Suspense fallback={null}>
            <UnauthorizedPage />
          </Suspense>
        ),
      },
      ...devRoutes,
    ],
  },
]);

export default router;
