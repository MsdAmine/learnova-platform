# Current State

This file is the authoritative current state of the Learnova project.
Read this before starting any new implementation task.

## Project Name

Learnova

## Current Milestone

Frontend UI refinement and dashboard/page implementation.

## Backend Status

The backend is feature-complete for the current phase. These modules exist and are working:

- Authentication: registration, login, JWT token issuance
- Roles and role seeding: ROLE_LEARNER, ROLE_INSTRUCTOR, ROLE_ADMIN
- Profile switching: learner profile created on registration; instructor profile requires admin approval
- Instructor approval workflow: request, pending, approved, rejected states
- Course base: course entity, category, instructor course CRUD

Do not recreate or re-implement any of the above. The backend foundation is done.

## Frontend Status

A React + TypeScript + Vite frontend exists and is actively in development.

What is in place:

- Auth context, JWT handling, localStorage token storage
- React Router v7 with ProtectedRoute, GuestRoute, InstructorRoute, and AdminRoute guards
- Axios request interceptor (attaches JWT) and response interceptor (401 → logout + /login, 403 → /unauthorized), wired at runtime via ApiInterceptorSetup in RootLayout
- UnauthorizedPage at `/unauthorized`
- DashboardLayout with sidebar and topbar
- LearnerDashboard, MyCoursesPage, ProgressPage, CertificatesPage, LiveSessionsPage, SettingsPage
- UI component primitives: Button, Badge, Card, Avatar, Input, FilterTabs, ProgressBar, and more
- Design token system in tokens.css aligned with DESIGN.md

What is in progress:

- UI system standardization across all pages
- InstructorRoute and AdminRoute exist but are not yet applied to instructor/admin routes (those routes do not yet exist)

## Current Priority

Build professional, consistent frontend interfaces using the Learnova design system.

All new UI work must follow the reading order:

1. `PRODUCT.md` — product purpose, users, brand personality, and design principles
2. `DESIGN.md` — canonical design system with all tokens
3. `docs/design/page-specs/<page>.md` — the page-specific layout spec for the surface being built

## What Not to Do

- Do not recreate project foundation, authentication, or dual-profile logic.
- Do not recreate backend modules that already exist.
- Do not redefine design tokens. All tokens live in `DESIGN.md` and `tokens.css`.
- Do not introduce gamification patterns, XP systems, or leaderboard UI.
- Do not use the hero-metric template (big number, gradient accent) inside the product dashboard.
