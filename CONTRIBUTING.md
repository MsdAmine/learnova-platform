# Contributing Guide

This document defines the contribution workflow for the Online Training Platform project.

## Branching Strategy

The project uses a simple branch-based workflow.

### Main branch:

```text
main
```

### Feature branches:

```text
feature/*
```

### Documentation branches:

```text
docs/*
```

### Maintenance branches:

```text
chore/*
```

### Examples:

- `feature/auth-module`
- `feature/dual-profile-system`
- `feature/course-management`
- `docs/architecture-overview`
- `chore/setup-repository-structure`

## Commit Convention

Use clear and meaningful commit messages.

Recommended format:

```text
type: short description
```

### Examples:

- `chore: initialize repository structure`
- `docs: add architecture overview`
- `feat: implement authentication module`
- `feat: add dual-profile system`
- `fix: correct enrollment validation`
- `refactor: improve course service structure`
- `test: add quiz service tests`

### Common types:

- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`
- `style`

## Pull Request Workflow

All changes should be made through pull requests.

A pull request should include:

- Clear summary
- Related issue
- Description of changes
- Testing notes
- Screenshots if UI changes are included

### Pull Request Rules

Before requesting review, make sure:

- The branch is up to date with main
- The code builds successfully
- The change is limited to the issue scope
- Documentation is updated when needed
- No unrelated files are included

## Code Organization

The backend should follow a modular structure.

Each module should contain:

- `controller`
- `service`
- `dto`
- `entity`
- `repository`

The frontend should separate:

- `api`
- `components`
- `pages`
- `layouts`
- `hooks`
- `types`
- `utils`

## Documentation

Update documentation when adding or changing:

- Architecture
- API routes
- Database design
- Business rules
- Important technical decisions

Architecture decisions should be documented in:

```text
docs/decisions/
```

## Issue Management

Each major task should have a GitHub issue.

Recommended issue categories:

- Feature
- Bug
- Documentation
- Chore
- Refactor

## Testing

Backend features should include tests where possible.

Recommended test types:

- Unit tests for services
- Repository tests for database behavior
- Controller tests for API validation
- Integration tests for critical flows

## Project Scope

Avoid adding features outside the planned PFA scope unless they are approved and documented.

The current priority is:

- Authentication
- Dual-profile system
- Course management
- Enrollment
- Progress tracking
- Quiz system
- Live sessions
- Certificates
- Dashboards
