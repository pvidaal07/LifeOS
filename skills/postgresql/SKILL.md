---
name: postgresql
description: PostgreSQL schema and query safety rules for LifeOS. Use when changing tables, indexes, constraints, migrations, date handling, performance-sensitive queries, or any persistence design decision.
---

# PostgreSQL

## Objetivo
Diseñar esquemas y consultas seguras para un sistema multiusuario con crecimiento incremental.

## REQUIRED
- Usar migraciones versionadas; no editar tablas manualmente en producción.
- Mantener claves primarias UUID y `created_at`/`updated_at` en tablas principales.
- Indexar por acceso real, priorizando patrones con `user_id`.
- Definir restricciones (`UNIQUE`, `CHECK`, `NOT NULL`) para invariantes de negocio.
- Usar `DATE` para agenda diaria (`scheduled_date`) y `TIMESTAMP` para eventos (`completed_date`).
- Revisar consultas costosas con `EXPLAIN` antes de cerrar cambios relevantes.

## NEVER
- No fiar aislamiento de datos a filtros en frontend.
- No introducir columnas ambiguas sin convención (`snake_case`, semántica clara).
- No crear índices redundantes sin justificar lectura/escritura.
- No hacer cambios destructivos sin migración reversible o plan de rollback.

## Checklist de cambio
1. Ajustar `backend/prisma/schema.prisma`.
2. Generar migración y revisar SQL resultante.
3. Validar que consultas críticas siguen usando índices.
4. Verificar impacto en endpoints y tests.
