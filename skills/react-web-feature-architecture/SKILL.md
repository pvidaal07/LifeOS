---
name: react-web-feature-architecture
description: React web feature architecture guidelines for LifeOS. Use when creating pages, feature modules, forms, API hooks, global stores, and UI composition in frontend/src for scalable and testable structure.
---

# React Web Feature Architecture

## Objetivo
Organizar frontend por features para escalar sin acoplar vistas, estado y acceso a API.

## REQUIRED
- Estructurar por dominio/feature (auth, dashboard, studies, etc.).
- Separar UI reusable (`components`) de lógica de feature.
- Centralizar cliente HTTP en `frontend/src/api`.
- Usar TanStack Query para estado servidor (fetch/cache/retry).
- Reservar Zustand para estado cliente/global (sesión, UI).
- Tipar respuestas API y normalizar errores en hooks.
- Mantener páginas ligeras: composición + navegación, no reglas de negocio.

## NEVER
- No duplicar lógica de fetching en múltiples componentes.
- No mezclar estado remoto en stores globales sin necesidad.
- No acoplar componentes de UI a endpoints concretos.

## Flujo recomendado
1. Definir contrato API del feature.
2. Crear `api.*` + hook de query/mutation.
3. Crear componentes presentacionales.
4. Componer página y cubrir estados loading/error/empty/success.
