---
name: spaced-repetition
description: Business rules for LifeOS review scheduling and mastery scoring. Use when implementing or modifying study session completion, review generation, interval multipliers, urgency calculation, or topic mastery updates.
---

# Spaced Repetition

## Objetivo
Aplicar reglas deterministas de repaso para mantener retención y priorizar lo urgente.

## REGLAS BASE
- Al registrar primera sesión de estudio, programar primer repaso según intervalo base (por defecto 1 día).
- Mantener configuración por usuario en `review_settings` (`base_intervals`, multiplicadores).
- Al completar repaso:
  - `perfect` → `interval * perfectMultiplier`
  - `good` → `interval * goodMultiplier`
  - `regular` → `interval * regularMultiplier`
  - `bad` → reset al primer intervalo si `badReset=true`
- Crear siguiente repaso con `reviewNumber + 1` y `status=pending`.
- Recalcular `systemMasteryLevel` tras cada resultado.

## URGENCIA
Calcular prioridad usando retraso, intervalo esperado y dominio para ordenar el dashboard diario.

## REQUIRED
- Persistir todo cálculo asociado al `userId` autenticado.
- Tratar `scheduled_date` como fecha de calendario (sin hora de negocio).
- Probar casos límite: `bad`, intervalos mínimos, repasos atrasados.

## NEVER
- No permitir que cliente envíe intervalos finales como fuente de verdad.
- No mezclar reglas de negocio en controllers.
- No perder historial de resultados al regenerar repasos.
