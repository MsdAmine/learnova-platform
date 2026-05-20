# Learnova Platform: Definitive Project Structure Overview

This document provides a production-grade, high-fidelity directory tree mapping for both the **Spring Boot backend (`backend`)** and the **React TypeScript frontend (`frontend`)**. This reference verifies modular cohesion and architectural alignment across Phase 3 (File Storage, Public Interfaces) and Phase 4 (Instructor Course Management & Learner Enrollment).

---

## 1. Spring Boot Backend Layer (`backend`)

The backend is structured under a clean, domain-driven package organization starting from `com.learnova.learnova_backend`. The core modules are isolated into cohesive domains (`course`, `profile`, `security`, `user`, `file`, and `auth`) to promote modularity and clean separation of concerns.

Key files recently established or updated include:
*   `Course.java` (The core JPA entity for Course persistence)
*   `CourseSpecification.java` (Criteria-based dynamic query specifications for public catalog search)
*   `PublicCourseController.java` (The public unauthenticated endpoint gateway)
*   `PublicCourseService.java` (Reconciled from `PublicCourseDetailsService` to handle public dynamic searches)
*   `EnrollmentController.java` (The REST controller for Learner course enrollments)
*   `EnrollmentService.java` (Validates eligibility and manages course registration workflow)
*   `Enrollment.java` (The JPA Entity representing Course enrollment states)
*   `UserLessonController.java` (Exposes student-facing course lessons and content hierarchy API)

### Backend ASCII File Tree

```
backend
└── src
    └── main
        ├── java
        │   └── com
        │       └── learnova
        │           └── learnova_backend
        │               ├── LearnovaBackendApplication.java
        │               ├── auth
        │               │   ├── controller
        │               │   │   └── AuthController.java
        │               │   ├── dto
        │               │   │   ├── CurrentUserResponse.java
        │               │   │   ├── LoginRequest.java
        │               │   │   ├── LoginResponse.java
        │               │   │   ├── RegisterRequest.java
        │               │   │   └── RegisterResponse.java
        │               │   └── service
        │               │       └── AuthService.java
        │               ├── common
        │               │   └── config
        │               │       └── DataInitializer.java
        │               ├── course
        │               │   ├── controller
        │               │   │   ├── CategoryController.java
        │               │   │   ├── CourseController.java
        │               │   │   ├── EnrollmentController.java           <-- [Key File: Course Enrollment API]
        │               │   │   ├── LessonController.java
        │               │   │   ├── PublicCourseController.java         <-- [Key File: Public Endpoints]
        │               │   │   ├── SectionController.java
        │               │   │   └── UserLessonController.java           <-- [Key File: Student Lesson & Content API]
        │               │   ├── dto
        │               │   │   ├── CategoryRequest.java
        │               │   │   ├── CategoryResponse.java
        │               │   │   ├── CourseRequest.java
        │               │   │   ├── CourseResponse.java
        │               │   │   ├── CourseSearchCriteria.java
        │               │   │   ├── CourseSummaryResponse.java
        │               │   │   ├── CourseUpdateRequest.java
        │               │   │   ├── EnrollmentResponse.java
        │               │   │   ├── LearnerCourseContentResponse.java   <-- [Key File: Course Content Tree Response]
        │               │   │   ├── LearnerEnrollmentResponse.java
        │               │   │   ├── LearnerLessonDTO.java
        │               │   │   ├── LearnerSectionDTO.java
        │               │   │   ├── LessonRequest.java
        │               │   │   ├── LessonResponse.java
        │               │   │   ├── PublicCourseDetailResponse.java
        │               │   │   ├── PublicLessonDTO.java
        │               │   │   ├── PublicSectionDTO.java
        │               │   │   ├── SectionRequest.java
        │               │   │   └── SectionResponse.java
        │               │   ├── entity
        │               │   │   ├── Category.java
        │               │   │   ├── Course.java                         <-- [Key File: JPA Entity]
        │               │   │   ├── CourseLevel.java
        │               │   │   ├── CourseStatus.java
        │               │   │   ├── Enrollment.java                     <-- [Key File: Enrollment JPA Entity]
        │               │   │   ├── EnrollmentStatus.java
        │               │   │   ├── Lesson.java
        │               │   │   ├── LessonContentType.java
        │               │   │   └── Section.java
        │               │   ├── repository
        │               │   │   ├── CategoryRepository.java
        │               │   │   ├── CourseRepository.java
        │               │   │   ├── EnrollmentRepository.java
        │               │   │   ├── LessonRepository.java
        │               │   │   ├── SectionRepository.java
        │               │   │   └── specification
        │               │   │       └── CourseSpecification.java         <-- [Key File: Dynamic Query Spec]
        │               │   └── service
        │               │       ├── CategoryService.java
        │               │       ├── CourseService.java
        │               │       ├── EnrollmentService.java              <-- [Key File: Course Enrollment Business Logic]
        │               │       ├── LessonService.java
        │               │       ├── PublicCourseService.java             <-- [Key File: Dynamic Course Filtering]
        │               │       └── SectionService.java
        │               ├── file
        │               │   ├── exception
        │               │   │   └── FileStorageException.java
        │               │   └── service
        │               │       ├── FileStorageService.java
        │               │       └── impl
        │               │           └── LocalFileStorageServiceImpl.java <-- [Key File: Asset Storage Management]
        │               ├── profile
        │               │   ├── controller
        │               │   │   ├── AdminInstructorProfileController.java
        │               │   │   ├── InstructorProfileController.java
        │               │   │   └── ProfileSwitchController.java
        │               │   ├── dto
        │               │   │   ├── InstructorProfileRejectionRequest.java
        │               │   │   ├── InstructorProfileRequest.java
        │               │   │   ├── InstructorProfileResponse.java
        │               │   │   ├── ProfileSwitchRequest.java
        │               │   │   └── ProfileSwitchResponse.java
        │               │   ├── entity
        │               │   │   ├── InstructorApprovalStatus.java
        │               │   │   ├── InstructorProfile.java
        │               │   │   ├── LearnerProfile.java
        │               │   │   └── ProfileType.java
        │               │   ├── repository
        │               │   │   ├── InstructorProfileRepository.java
        │               │   │   └── LearnerProfileRepository.java
        │               │   └── service
        │               │       ├── InstructorProfileService.java
        │               │       ├── LearnerProfileService.java
        │               │       ├── ProfileAccessService.java
        │               │       └── ProfileSwitchService.java
        │               ├── security
        │               │   ├── CustomUserDetails.java
        │               │   ├── CustomUserDetailsService.java
        │               │   ├── JwtAuthenticationFilter.java
        │               │   ├── JwtService.java
        │               │   ├── PasswordConfig.java
        │               │   └── SecurityConfig.java                      <-- [Key File: Security Access Filters]
        │               └── user
        │                   ├── config
        │                   │   └── RoleSeeder.java
        │                   ├── entity
        │                   │   ├── AccountStatus.java
        │                   │   ├── Role.java
        │                   │   ├── RoleName.java
        │                   │   └── User.java
        │                   └── repository
        │                       ├── RoleRepository.java
        │                       └── UserRepository.java
        └── resources
            └── application.yaml
```

---

## 2. React TypeScript Frontend Layer (`frontend`)

The frontend conforms to a scalable, features-based architecture. Common services, components, types, and contexts sit in the root of `/src`, while functional pages and subcomponents are encapsulated under `src/features/`.

Key structural focal points include:
*   `src/features/instructor/` (Encapsulates all Instructor workflows, with key pages for Course List, Creation, and Editing)
*   `src/router/index.tsx` (The core application routing system using react-router-dom)
*   `src/context/AuthContext.tsx` (Global Auth, JWT handling, and profile synchronization)
*   `src/types/course.ts` (Central TypeScript schemas mapping Course, Section, and Lesson responses)

### Frontend ASCII File Tree

```
frontend
└── src
    ├── api
    │   └── axios.ts
    ├── assets
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components
    │   └── common
    │       ├── GuestRoute.tsx
    │       ├── Navbar.tsx
    │       ├── ProtectedRoute.tsx
    │       └── RoleGuard.tsx             <-- [Key File: Role-Based Redirection Guard]
    ├── context
    │   └── AuthContext.tsx               <-- [Key File: Auth & State Management Context]
    ├── features
    │   ├── auth
    │   │   └── pages
    │   │       ├── LoginPage.tsx
    │   │       └── RegisterPage.tsx
    │   ├── instructor
    │   │   ├── hooks
    │   │   │   └── useInstructorCourses.ts
    │   │   └── pages
    │   │       ├── InstructorCourseCreate.tsx <-- [Key File: Course Builder Wizard]
    │   │       ├── InstructorCourseEdit.tsx   <-- [Key File: Content Editor Console]
    │   │       ├── InstructorCourseList.tsx   <-- [Key File: Instructor Listing Dashboard]
    │   │       └── InstructorDashboard.tsx
    │   └── learner
    │       └── pages
    │           └── LearnerDashboard.tsx
    ├── hooks
    │   └── useCurrentUser.ts             <-- [Key File: User State Hook]
    ├── layouts
    │   └── MainLayout.tsx
    ├── pages
    │   ├── DashboardPage.tsx
    │   └── NotFoundPage.tsx
    ├── router
    │   └── index.tsx                     <-- [Key File: Central Router with Protection Routing]
    ├── types
    │   ├── common.ts
    │   ├── course.ts                     <-- [Key File: Domain-Specific Type Definitions]
    │   └── profile.ts
    ├── App.css
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── vite-env.d.ts
```

---

## 3. Modular Cohesion & Architectural Highlights

The alignment between `backend` and `frontend` facilitates high cohesion and rapid iteration:

1.  **Public Catalog Dynamic Search**:
    *   `PublicCourseController` maps queries directly to the JPA Specifications configured in `CourseSpecification`.
    *   The frontend consumes this dynamic search via axios instances, passing filters for keyword, level, and category.
2.  **Asset and Storage Pipelines**:
    *   Backend `LocalFileStorageServiceImpl` manages file system asset life cycle.
    *   Frontend modules (`InstructorCourseCreate`, `InstructorCourseEdit`) upload and retrieve course thumbnails and lesson files synchronously using standard multipart forms.
3.  **Role-Based Separation of Workspaces**:
    *   The backend validates JWT authorities via `JwtAuthenticationFilter` and checks annotations like `@PreAuthorize("hasRole('INSTRUCTOR')")`.
    *   The frontend replicates this hierarchy through `RoleGuard` in `src/router/index.tsx`, dynamically rendering specific feature spaces like `/instructor/*` based on states synchronized inside `AuthContext`.
4.  **Course Enrollment Engine**:
    *   The backend orchestrates student eligibility, course validation, and status transitions via `EnrollmentService`.
    *   Enrollment records are mapped through `EnrollmentRepository` and exposed securely via `EnrollmentController` using custom mapping DTOs like `LearnerEnrollmentResponse`.
5.  **Learner Course Content Delivery**:
    *   Enrolled students can fetch the entire course section-lesson content tree via the secured endpoint exposed in `UserLessonController`.
    *   `CourseService` fetches and maps the domain objects to nested tree payloads (`LearnerCourseContentResponse`, `LearnerSectionDTO`, `LearnerLessonDTO`) after running strict checks via `CourseAccessService`.
