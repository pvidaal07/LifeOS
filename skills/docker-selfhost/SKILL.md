---
name: docker-selfhost
description: Docker Compose self-hosting conventions for LifeOS development and production. Use when editing compose files, environment variables, service networking, persistent volumes, health checks, or deployment workflows.
---

# Docker Selfhost

## Objetivo
Mantener paridad dev/prod con despliegue reproducible en VPS/autohosting.

## REQUIRED
- Mantener `docker-compose.yml` para desarrollo (DB + utilidades) y `docker-compose.prod.yml` para stack completo.
- Usar `.env.example` como plantilla mínima de variables.
- Persistir PostgreSQL con volumen dedicado (`lifeos_pgdata`).
- Definir `healthcheck` y `depends_on` en servicios críticos.
- Exponer puertos públicos solo en servicios frontera (proxy/web).
- Asegurar que backend usa `DATABASE_URL` interno de red Docker en producción.

## NEVER
- No commitear secretos reales en `.env`.
- No depender de nombres/puertos hardcodeados sin variables.
- No desplegar cambios de compose sin validar build/arranque local.

## Checklist de despliegue
1. Actualizar `.env` producción.
2. `docker compose -f docker-compose.prod.yml up -d --build`.
3. Verificar healthchecks, logs y conectividad API/UI.
