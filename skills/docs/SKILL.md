---
name: docs
description: Repository documentation conventions for LifeOS. Use when creating or updating README, docs/*, architecture notes, API behavior notes, or implementation decisions that must remain clear for future contributors and agents.
---

# Docs

## Objetivo
Mantener documentación breve, accionable y sincronizada con el código real.

## REQUIRED
- Escribir en Markdown con estructura clara (títulos, listas, tablas cuando aporten).
- Registrar decisiones técnicas con contexto: qué, por qué, impacto.
- Documentar rutas/archivos reales del repo (no rutas teóricas).
- Actualizar docs al cambiar contratos API, flujos auth o comandos de despliegue.
- Incluir ejemplos mínimos ejecutables cuando aplique (comandos, payloads).

## NEVER
- No dejar TODOs ambiguos sin contexto.
- No duplicar bloques largos ya definidos en otra fuente canónica.
- No mezclar estado actual con ideas futuras sin etiquetarlo explícitamente.

## Plantilla breve de decisión
- **Contexto**
- **Decisión**
- **Consecuencias**
- **Archivos afectados**
