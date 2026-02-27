---
name: typescript
description: Strict TypeScript guidance for LifeOS backend (NestJS) and frontend (React). Use when creating or refactoring DTOs, domain/application types, API client types, generics, type guards, or when resolving TypeScript errors without weakening type safety.
---

# TypeScript

## Objetivo
Definir tipos explícitos y estables entre backend y frontend sin usar atajos inseguros.

## REQUIRED
- Declarar tipos de entrada/salida en funciones públicas.
- Tipar fronteras con `unknown` y refinar con type guards.
- Mantener DTOs separados de entidades de dominio.
- Centralizar tipos compartidos por feature (`frontend/src/types` o `frontend/src/features/*/types`).
- Usar uniones literales/enums para estados de negocio (`pending`, `completed`, etc.).
- Modelar nullabilidad real (`string | null`) y evitar asumir valores.

## NEVER
- No usar `any` salvo bloqueo temporal explícitamente comentado.
- No usar `as` para ocultar errores de diseño de tipos.
- No mezclar tipos de Prisma directamente en capas de dominio/aplicación.
- No devolver objetos parcialmente tipados en endpoints públicos.

## Flujo recomendado
1. Definir contrato (DTO/Response) primero.
2. Definir tipo de dominio/aplicación separado.
3. Crear mapper explícito entre contrato y dominio.
4. Ejecutar `tsc`/`vitest` y corregir sin relajar tipos.
