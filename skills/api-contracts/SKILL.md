---
name: api-contracts
description: API DTO and response contract rules for LifeOS backend/frontend compatibility. Use when adding or changing endpoints, request/response DTOs, error payloads, versioning decisions, or Swagger/OpenAPI documentation.
---

# API Contracts

## Objetivo
Mantener contratos HTTP estables y explícitos para evitar roturas entre backend y frontend.

## REQUIRED
- Definir DTOs de entrada/salida por endpoint.
- Mantener envoltorio de éxito consistente (`data`, `statusCode`, `timestamp`) salvo decisión explícita.
- Mantener formato de error consistente (`statusCode`, `message`, `timestamp`, `path`).
- Documentar endpoints y DTOs en Swagger.
- Preferir cambios aditivos (campos opcionales) para compatibilidad hacia atrás.
- Versionar (`/api/v1`) antes de introducir breaking changes.

## NEVER
- No devolver entidades internas de ORM directamente.
- No cambiar nombres/tipos de campos públicos sin plan de migración.
- No mezclar idiomas/formatos en mensajes de error de la misma API.

## Checklist
1. Actualizar DTO + controller/service.
2. Ajustar tipos frontend (`frontend/src/api`, `frontend/src/types`).
3. Verificar documentación y tests.
