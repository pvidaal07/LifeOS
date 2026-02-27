---
name: testing-vitest
description: Vitest testing patterns for LifeOS backend and frontend. Use when adding unit/integration tests, refactoring behavior, fixing regressions, or validating business rules such as ownership and spaced review scheduling.
---

# Testing Vitest

## Objetivo
Cubrir comportamiento de negocio con tests estables, rápidos y legibles.

## REQUIRED
- Escribir tests AAA (Arrange, Act, Assert).
- Nombrar casos en lenguaje de negocio, no de implementación.
- Priorizar unit tests para lógica pura (algoritmos, validaciones, mappers).
- Añadir integration tests para flujos críticos de API/repositorio.
- Mockear dependencias externas (DB real, red, tiempo) cuando no sea un test de integración.
- Cubrir casos borde: ownership, estados inválidos, fechas límite, respuestas vacías.

## NEVER
- No testear detalles internos frágiles (spies excesivos, private methods).
- No depender del orden global de ejecución.
- No introducir sleeps reales si se puede usar fake timers.

## Estructura sugerida
- Backend: `backend/test/{domain,application,integration}`.
- Frontend: tests junto a feature o en `frontend/src/test` por módulo.

## Flujo recomendado
1. Reproducir bug/regla faltante en test.
2. Implementar cambio mínimo.
3. Ejecutar suite objetivo y luego suite completa.
