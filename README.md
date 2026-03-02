# LifeOS

<div align="center">

### Tu sistema operativo personal para estudiar y vivir con claridad

_Un solo lugar para planificar, ejecutar y mejorar tu progreso real._

</div>

---

## La idea detras de LifeOS

La mayoria de apps personales se quedan en listas o notas sueltas. LifeOS nace para unir **planificacion + accion + feedback** en un mismo flujo.

En vez de guardar informacion y olvidarla, LifeOS convierte objetivos en trabajo diario medible:

- Definir que quieres conseguir
- Dividirlo en unidades claras
- Registrar sesiones reales de trabajo
- Reforzar lo aprendido con repasos espaciados
- Ver tu avance de forma accionable

---

## Que problema resuelve

```text
Sin sistema:                  Con LifeOS:

Objetivos abstractos          Objetivos aterrizados en planes
Temas sin seguimiento         Temas con sesiones y repaso
Estudio por impulso           Estudio guiado por prioridades
Sensacion de "no avanzo"      Progreso visible y medible
```

---

## MVP actual: modulo de Estudios

Hoy LifeOS esta centrado en un MVP funcional de estudio, con este recorrido:

`Plan -> Asignaturas -> Temas -> Sesiones -> Repasos`

Incluye:

- Gestion de planes, asignaturas y temas
- Registro de sesiones de estudio
- Sistema de repaso espaciado
- Dashboard diario con foco en "que toca hoy"
- Autenticacion por usuario (cada cuenta solo ve sus datos)

---

## Filosofia del producto

- **Simple por fuera, potente por dentro**: interfaz clara con reglas solidas
- **Progreso real**: menos ruido, mas ejecucion
- **Modular**: Estudios es el primer modulo; el sistema crece hacia otras areas
- **Personal**: cada dato pertenece al usuario autenticado

---

## Stack tecnico

| Capa | Tecnologia |
|------|------------|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Estado | Zustand + TanStack Query |
| Backend | NestJS + TypeScript |
| Persistencia | PostgreSQL + Prisma |
| Auth | JWT (access + refresh tokens) |
| Testing | Vitest |
| Infra | Docker Compose |

---

## Arquitectura del repo

```text
LifeOS/
|- backend/    API y reglas de negocio
|- frontend/   App web
|- db/         Configuración de base de datos y entorno
|- docs/       Vision de producto y alcance
|- skills/     Reglas y guias de desarrollo asistido por IA
```

---

## Para levantar el proyecto en local

Toda la guia de instalacion y arranque se movio a:

- `SETUP-INFO.md`

Si quieres clonar, configurar variables, levantar Docker y arrancar frontend/backend, sigue ese archivo paso a paso.

---

## Roadmap (vision)

- Modulo de estudios mas completo (analitica y mejores flujos)
- Expansion a otras areas personales (salud, habitos, productividad)
- Mejoras de experiencia diaria y personalizacion
- Despliegue self-host para uso personal estable

---

## Estado del proyecto

LifeOS esta en evolucion activa. El objetivo actual es consolidar un MVP de estudio realmente util antes de ampliar modulos.

Si quieres contribuir, revisar ideas o construir encima del proyecto, bienvenido.

---

## Licencia

MIT
