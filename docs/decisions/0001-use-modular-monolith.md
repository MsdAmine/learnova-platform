# ADR 0001: Use Modular Monolith Architecture

## Status

Accepted

## Context

The project is a 4th year PFA online training platform.

The platform includes several features:

- Authentication
- Dual-profile system
- Course management
- Enrollment
- Progress tracking
- Quizzes
- Certificates
- Live sessions
- Notifications
- Discussions
- Reviews
- Admin moderation

A microservices architecture could separate these capabilities into independent services. However, microservices would introduce additional complexity such as:

- Service discovery
- Distributed authentication
- Inter-service communication
- Multiple deployments
- Distributed transactions
- Complex testing
- Infrastructure overhead

For the scope of the PFA, this complexity is not justified.

## Decision

The project will use a modular monolith architecture.

The backend will be deployed as one Spring Boot application, but internally organized into separate business modules.

Main modules include:

- Auth
- User and Profile
- Course
- Enrollment
- Progress
- Quiz
- Certificate
- Live Session
- Notification
- Discussion
- Review
- Admin

## Consequences

### Positive

- Easier development
- Easier deployment
- Clear module separation
- Simpler testing
- Better fit for PFA scope
- Future migration to microservices remains possible

### Negative

- All modules are deployed together
- Strong discipline is required to keep module boundaries clean
- The application could become harder to maintain if modules are not properly separated

## Future Considerations

If the application grows, some modules could later be extracted into independent services.

Possible future services:

- Authentication service
- Course service
- Notification service
- Certificate service
- Live session service
