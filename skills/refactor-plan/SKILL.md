---
name: refactor-plan
description: Incremental refactor playbook for moving legacy LifeOS code toward Clean Architecture/DDD. Use when splitting monolithic services/controllers, introducing ports/adapters, or migrating features without breaking current behavior.
---

# Refactor Plan

## Objetivo
Refactorizar por slices de funcionalidad sin detener entregas ni romper contratos.

## Estrategia incremental
1. Aislar una feature concreta (ej. reviews).
2. Congelar comportamiento actual con tests de caracterización.
3. Extraer reglas a dominio/aplicación (casos de uso + puertos).
4. Implementar adapters en infraestructura.
5. Conectar controller actual al nuevo caso de uso.
6. Eliminar código legacy solo cuando pruebas y contratos estén verdes.

## REQUIRED
- Migrar un flujo de negocio cada vez.
- Mantener compatibilidad de API durante la transición.
- Documentar decisiones de corte (qué quedó migrado y qué no).

## NEVER
- No hacer big-bang rewrite.
- No mezclar reglas nuevas y legacy sin límites claros.
- No borrar código antiguo sin cobertura mínima del nuevo camino.
