---
name: clean-architecture-ddd
description: >
  Clean Architecture + DDD rules for this repo.
  Triggers: adding/refactoring code across src/domain|application|infrastructure,
  moving files between layers, creating ports/adapters/use-cases.
metadata:
  scope: project
  version: 1.0.0
auto_invoke:
  - "Create or modify entities/value objects/use-cases/ports"
  - "Move code between layers"
allowed-tools:
  - "none"
---

# clean-architecture-ddd

## REQUIRED
- Dependencies point inward: `infrastructure -> application -> domain`.
- Domain has **zero** NestJS/DB/HTTP imports.
- Application defines **ports**; infrastructure implements them.
- DTOs stay in application/infrastructure. Domain returns domain types only.

## NEVER
- Never place business rules in controllers/adapters.
- Never let ORM entities leak into domain.
- Never skip a use-case by calling repositories directly from controllers.

## Snippets

### Port + Adapter shape
- Port in application:
  - `export interface XPort { ... }`
  - token: `export const X_PORT = Symbol("X_PORT")`
- Adapter in infrastructure:
  - `class XAdapter implements XPort { ... }`
  - provided via Nest DI binding to token.