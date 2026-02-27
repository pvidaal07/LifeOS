---
name: prisma-postgres
description: Prisma + PostgreSQL conventions for LifeOS persistence. Use when editing schema.prisma, generating migrations, implementing repositories/adapters, tuning transactions, or mapping Prisma models to application/domain contracts.
---

# Prisma Postgres

## Objetivo
Usar Prisma de forma predecible, segura y alineada con PostgreSQL multiusuario.

## REQUIRED
- Mantener fuente de verdad en `backend/prisma/schema.prisma`.
- Ejecutar migraciones con nombre semántico y revisar SQL generado.
- Usar `@map`/`@@map` para convención `snake_case` en DB.
- Encapsular operaciones multi-paso en `$transaction`.
- Limitar `select/include` a campos necesarios para evitar sobrecarga.
- Implementar filtros por `userId` en todas las consultas de negocio.

## NEVER
- No usar `prisma db push` como sustituto de migraciones en flujos serios.
- No propagar tipos Prisma sin mapeo a capas de negocio/contrato.
- No usar SQL raw sin necesidad clara y sanitización de parámetros.

## Flujo estándar
1. Cambiar schema.
2. `prisma migrate dev`.
3. `prisma generate`.
4. Ajustar código y tests.
