---
name: auth-and-ownership
description: Authentication and ownership enforcement rules for LifeOS multi-user isolation. Use when creating or changing auth flows, guarded endpoints, user-scoped queries, or nested resource access checks.
---

# Auth and Ownership

## Objetivo
Garantizar que cada usuario solo pueda leer y modificar sus propios datos.

## REQUIRED
- Obtener `userId` únicamente del contexto autenticado (JWT `sub` / `@CurrentUser`).
- Aplicar guardas (`JwtAuthGuard`) en endpoints privados.
- Filtrar lecturas y escrituras por `userId` en repositorios/queries.
- Validar ownership en recursos anidados (plan → subject → topic → review).
- Invalidar refresh token al logout/rotación según estrategia vigente.

## NEVER
- No aceptar `userId` desde body/query/params como fuente de autorización.
- No devolver datos de existencia de recursos ajenos.
- No saltar validaciones de ownership en operaciones masivas.

## Respuesta ante acceso inválido
- Preferir respuesta neutra (`404` o error de dominio equivalente) para no filtrar existencia.
- Loguear intentos sospechosos sin exponer secretos al cliente.
