# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LearnOva is a full-stack online learning platform (4th-year PFA project) with a modular monolith backend and a React frontend. It features a **dual-profile system**: one user account can operate as both a learner and an instructor simultaneously.

## Repository Layout

```
backend/    → Spring Boot application (Maven, Java 17)
frontend/   → React + TypeScript application (Vite)
docs/       → Architecture decisions and wireframes
```

## Backend Commands

All commands run from the `backend/` directory.

```bash
# Start the dev server
./mvnw spring-boot:run

# Build
./mvnw clean package

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=AuthLoginIntegrationTest

# Run tests matching a pattern
./mvnw test -Dtest="Auth*"
```

**Environment:** Copy `backend/.env.example` to `backend/.env`. Required variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`. Defaults are provided in `application.yaml` for local development.

**Test database:** Tests use an in-memory H2 database (PostgreSQL-compatibility mode) via `src/test/resources/application-test.yml`. No external database is needed to run tests.

## Frontend Commands

All commands run from the `frontend/` directory.

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

**Environment:** Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_API_BASE_URL=http://localhost:8080/api/v1`.

## Backend Architecture

**Base package:** `com.learnova.learnova_backend`

Each feature is a sub-package following this layout:
```
<module>/
  controller/   → @RestController, maps HTTP → service calls
  service/      → business logic
  dto/          → request/response POJOs (Lombok, Bean Validation)
  entity/       → JPA entities (Lombok builder pattern)
  repository/   → Spring Data JPA interfaces
```

**Current modules:**
- `auth` — registration, login, `/api/v1/auth/me`
- `user` — `User` entity, `Role`/`RoleName`, `AccountStatus`, `RoleSeeder`
- `profile` — `LearnerProfile`, `InstructorProfile`, profile switching, admin approval
- `course` — `Course`, `Category`, course CRUD for instructors
- `security` — JWT filter, `CustomUserDetails`, `SecurityConfig`, `JwtService`

**Security model:**
- Stateless JWT — `JwtAuthenticationFilter` validates the token before every request
- `CustomUserDetails` wraps `User` and exposes roles as `GrantedAuthority`
- Method-level authorization via `@PreAuthorize("hasRole('INSTRUCTOR')")` — `@EnableMethodSecurity` is active
- CORS is configured to allow `http://localhost:5173`

**Role seeding:** `RoleSeeder` (a `CommandLineRunner`) inserts all `RoleName` enum values into the `roles` table on startup if they don't exist. Do not seed roles manually.

**Dual-profile domain rules:**
- `User` = identity. `LearnerProfile` and `InstructorProfile` are 1-to-1 with `User`.
- A learner profile is created automatically on registration.
- An instructor profile is created by user request and must be approved by an ADMIN before the instructor role is granted.
- `ProfileAccessService.resolveAvailableProfiles()` is the single source of truth for what profiles a user can switch to.
- Learning data belongs to `LearnerProfile`; teaching data belongs to `InstructorProfile`.

**JPA conventions:**
- Timestamps use `Instant` (not `LocalDateTime`).
- `@PrePersist` / `@PreUpdate` set `createdAt` / `updatedAt`.
- Production DDL: `ddl-auto: update`. Test DDL: `create-drop`.

## Frontend Architecture

**Auth state** lives in `AuthContext` (`src/context/AuthContext.tsx`). It stores the JWT token, user object, and `activeProfile` in `localStorage`. `useAuth()` is the hook to consume it.

**Routing** (`src/router/index.tsx`) uses React Router v7. `ProtectedRoute` redirects unauthenticated users to `/login`. `GuestRoute` redirects authenticated users away from auth pages.

**Feature pages** live under `src/features/<feature>/pages/`. Shared components go under `src/components/common/`. API calls are centralized in `src/api/axios.ts`.

**Active profile switching:** The `activeProfile` field in `AuthContext` controls which dashboard/experience is shown. Its value is one of the `ProfileType` union type values (`'LEARNER' | 'INSTRUCTOR'`).

## API Surface (current)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Authenticated |
| GET/POST | `/api/v1/categories` | GET public, POST ADMIN |
| POST | `/api/v1/instructor-profile/request` | Authenticated |
| GET | `/api/v1/instructor-profile/me` | Authenticated |
| GET | `/api/v1/admin/instructor-profiles/pending` | ADMIN |
| POST | `/api/v1/admin/instructor-profiles/{id}/approve` | ADMIN |
| POST | `/api/v1/admin/instructor-profiles/{id}/reject` | ADMIN |
| POST | `/api/v1/instructor/courses` | INSTRUCTOR |
| PATCH | `/api/v1/instructor/courses/{id}` | INSTRUCTOR |

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Branching & Commit Conventions

Branch prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`

Commit format: `type: short description` (e.g., `feat: implement enrollment endpoint`)