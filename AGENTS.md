# AI Repo Guide (AGENTS) — LifeOS

## How to use this guide

- Start here for **repo-wide** rules, architecture boundaries, and the skills catalog.
- When working inside a specific folder/component, **ALWAYS read its local `AGENTS.md` first**.
- **Override rule:** If a local `AGENTS.md` conflicts with this root guide, **the local one wins** for that folder subtree.
- Skills live in `/skills/<skill>/SKILL.md`. Skills define **REQUIRED** and **NEVER** rules plus code patterns.

---

## Project overview

LifeOS is a **personal Life CRM / Personal OS** built as a **monorepo**:
- **API**: NestJS + TypeScript backend, target architecture **Clean Architecture / DDD**
- **Frontend Web**: React + TypeScript (web-first)
- **DB**: PostgreSQL in Docker with persistent volume (self-hostable)

Primary goal:
- Deliver a usable **Study MVP** (plans → subjects → topics → sessions → spaced reviews)
- While ensuring the backend is correctly structured for long-term growth.

---

## Repository layout

### Components

| Component | Location | Stack/Notes |
|----------|----------|-------------|
| API | `/api` | NestJS + TS. Must follow **Clean Architecture / DDD**. |
| Frontend Web | `/frontend` | React + TS. Feature-based modules. |
| Database | `/db` | Docker Compose, Postgres, volumes, env templates. |
| Docs | `/docs` | Product vision + MVP scope + user flows (non-technical). |
| Skills pack | `/skills` | AI skills with REQUIRED/NEVER rules & patterns. |

> **IMPORTANT:** Each component can have a local `AGENTS.md`.  
> Local rules override this root guide for that subtree.

---

## Architecture boundaries (API is strict)

The API must be refactored (or kept) to:

- Source layout: `api/src/{domain,application,infrastructure,shared}`
- Tests: `api/test/**` (Vitest)
- Database: PostgreSQL via Prisma (recommended), isolated by `userId` ownership.

### Layer responsibilities (Clean Architecture / DDD)

| Layer | Location | What belongs here | NEVER |
|------|----------|-------------------|-------|
| Domain | `/api/src/domain` | Entities, Value Objects, domain services, domain errors, invariants | No NestJS, no Prisma, no HTTP |
| Application | `/api/src/application` | Use-cases, ports (interfaces), DTOs, orchestration | No Prisma models, no controllers |
| Infrastructure | `/api/src/infrastructure` | NestJS modules/controllers, Prisma adapters, mappers, persistence, auth adapters | No business rules embedded |
| Shared | `/api/src/shared` | Cross-cutting utils (config, logging, common errors, helpers) | Don’t dump random code |

**Dependency direction:**
`domain` ← `application` ← `infrastructure`

---

## Multi-user / data isolation rule

LifeOS is **multi-user** (registration/login).  
Data must be isolated so each user only sees their own records.

**Rule:** every query and write must be scoped to `userId` (UUID) derived from auth context (NOT from client input).

---

## Available Skills

### Generic

| Skill | Purpose | Link |
|------|---------|------|
| `typescript` | Strict TS patterns, DTO boundaries, typing discipline | `/skills/typescript/SKILL.md` |
| `nestjs-best-practices` | Modules/DI/controllers/guards/interceptors/pipes | `/skills/nestjs-best-practices/SKILL.md` |
| `postgresql` | Schema/indexes/migrations/query safety | `/skills/postgresql/SKILL.md` |
| `testing-vitest` | Vitest structure, mocking, unit/integration testing | `/skills/testing-vitest/SKILL.md` |
| `docs` | Markdown conventions for repo docs | `/skills/docs/SKILL.md` |

### Project-specific (LifeOS)

| Skill | Purpose | Link |
|------|---------|------|
| `clean-architecture-ddd` | Layer rules, dependency direction, folder conventions (domain/application/infrastructure) | `/skills/clean-architecture-ddd/SKILL.md` |
| `spaced-repetition` | Business rules: review scheduling (+1/+7/+30), completion ratings, mastery score | `/skills/spaced-repetition/SKILL.md` |
| `auth-and-ownership` | Auth context → `userId` scoping, ownership checks in use-cases | `/skills/auth-and-ownership/SKILL.md` |
| `prisma-postgres` | Prisma schema conventions, migrations, transaction patterns | `/skills/prisma-postgres/SKILL.md` |
| `api-contracts` | DTOs, response envelopes, error mapping, backward compatibility | `/skills/api-contracts/SKILL.md` |
| `refactor-plan` | Safe incremental refactor playbook (feature-by-feature) | `/skills/refactor-plan/SKILL.md` |
| `react-web-feature-architecture` | Feature modules, forms, API hooks, UI patterns | `/skills/react-web-feature-architecture/SKILL.md` |
| `docker-selfhost` | Docker compose for local/prod parity, volumes, env templates | `/skills/docker-selfhost/SKILL.md` |

---

## Auto-invoke Skills (action → skill)

When performing these actions, **invoke the corresponding skill first**:

| Action (concrete) | Skill |
|------------------|-------|
| Add/change domain entity, value object, or domain error | `clean-architecture-ddd` |
| Add/change use-case, ports, DTOs | `clean-architecture-ddd` + `api-contracts` |
| Add/change NestJS modules/controllers/providers | `nestjs-best-practices` |
| Add/change Postgres schema, indexes, migrations | `postgresql` + `prisma-postgres` |
| Add/change Prisma schema, transactions, repositories | `prisma-postgres` |
| Implement/modify spaced repetition rules or mastery scoring | `spaced-repetition` |
| Add/modify auth flows or ownership checks | `auth-and-ownership` |
| Write/update tests in `api/test` | `testing-vitest` |
| Web feature (screens, forms, hooks, api client) | `react-web-feature-architecture` |
| Local/prod Docker compose changes | `docker-selfhost` |
| Refactor legacy API code into clean layers | `refactor-plan` + `clean-architecture-ddd` |
| Write/update repo documentation | `docs` |

---

## Optional: Commit / PR norms

- Prefer small PRs: one feature/fix per PR.
- Include tests for behavior changes (unit or integration).
- Keep domain/application changes free of framework/DB imports.
- Avoid breaking API contracts unless explicitly versioned or documented.
- Mention which skill(s) were applied if the change is non-trivial.