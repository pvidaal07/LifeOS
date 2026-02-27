# LifeOS

LifeOS es un “sistema operativo personal”: una plataforma para organizar tu vida en un solo lugar, conectando planificación diaria con tus áreas clave (estudio, deporte, nutrición y más). La idea es que no sea otra app suelta, sino un espacio central donde todo encaja y se apoya entre sí.

---

## 1) Visión completa (alcance total del proyecto)

### ¿Qué problema resuelve?
Hoy solemos tener la vida repartida entre herramientas distintas:
- calendario por un lado,
- tareas por otro,
- notas en otra app,
- hábitos en otra,
- planificación de estudio en otro sitio,
- rutinas de entrenamiento en un Excel,
- recetas y comidas en un bloc de notas…

Eso provoca:
- duplicar información,
- perder foco,
- olvidar cosas importantes,
- poca continuidad,
- y decisiones diarias repetidas (“¿qué tengo que hacer hoy?”, “¿qué estudio?”, “¿qué cocino?”, “¿cuándo repaso?”).

**LifeOS lo reúne todo** en un solo sistema personal que te acompaña en el día a día.

---

### ¿Qué es LifeOS?
Una plataforma modular donde cada “área de vida” es un módulo, pero todos comparten:
- un panel diario (“Hoy”),
- una planificación,
- métricas/progreso,
- y un flujo de trabajo coherente.

---

### Módulos previstos (visión final)

#### 1) Dashboard “Hoy” (centro del sistema)
Un panel diario que responda rápido a:
- qué tengo hoy,
- qué es lo más importante,
- qué se me está acumulando,
- qué toca repasar / entrenar / preparar,
- y cómo voy esta semana.

Incluye (en visión final):
- tareas y eventos del día
- repasos pendientes (estudio)
- entrenos planificados (deporte)
- comidas planificadas (nutrición)
- recordatorios y prioridades
- resumen rápido de progreso

---

#### 2) Calendario / Agenda
El módulo de planificación general:
- eventos (clases, citas, tareas, planes)
- tareas con estado y prioridades
- vistas día/semana/mes
- planificación por bloques (ideal para estudio/trabajo)
- integración de módulos (ver en el calendario: repasos, entrenos, comidas)

Objetivo: **que el calendario sea “la foto del día”**, no una lista infinita de cosas.

---

#### 3) Estudios (gestión + progreso + repasos)
El módulo para estudiar de forma organizada y constante:
- planes de estudio (ej. “Oposiciones 2026”, “Ingeniería Informática”)
- asignaturas
- temas
- sesiones registradas
- historial y progreso
- sistema de repasos programados (espaciado) para retener mejor lo aprendido
- lista diaria de “repasos pendientes”

Objetivo: **no pensar qué estudiar** y mantener constancia con un sistema claro.

---

#### 4) Deporte (entrenos y seguimiento)
Un lugar donde:
- guardas rutinas
- programas entrenos
- registras sesiones realizadas
- llevas progresos (por ejemplo fuerza, volumen, cardio, etc.)
- conectas entreno con planificación semanal

Objetivo: **entrenar con continuidad**, con menos fricción.

---

#### 5) Nutrición (recetas y planificación)
Un lugar donde:
- guardas recetas
- planificas comidas semanales
- generas listas (más adelante)
- reduces la fatiga de decidir qué comer cada día

Objetivo: **comer mejor sin improvisar**.

---

#### 6) Otros módulos futuros (posibles)
- Hábitos y rachas (con enfoque saludable, sin “culpa”)
- Objetivos/OKRs personales (metas trimestrales y revisión semanal)
- Notas / “Second brain” (con búsqueda y enlaces)
- Finanzas personales (básico → avanzado)
- Estadísticas y métricas (tiempo de estudio, consistencia, etc.)
- Automatizaciones / recordatorios inteligentes

---

### Filosofía del producto
- Un solo sistema, varios módulos
- Pocas decisiones repetidas: el sistema te muestra qué toca hoy
- Modularidad: empezar pequeño, crecer de forma ordenada
- Diseñado para uso real diario, no solo para “apuntar cosas”

---

## 2) MVP (v0.1) — construido para crecer

### Objetivo del MVP
Crear una primera versión usable y valiosa, centrada en **Estudios**, para que LifeOS:
- ya sea útil desde el primer momento,
- se pueda usar cada día,
- y sirva como base sobre la que se añadirán los demás módulos.

---

### ¿Qué incluye el MVP?
#### 1) Dashboard “Hoy” (versión inicial)
Un panel simple pero útil con:
- repasos pendientes del día
- sesiones recientes
- accesos rápidos para registrar estudio/repaso

Este dashboard es la semilla del “centro” de LifeOS.

---

#### 2) Estudios (núcleo del MVP)
Una estructura clara para organizarte:

- **Planes de estudio**
  - Ej: “Oposiciones 2026”, “Ingeniería Informática”
- **Asignaturas**
  - Ej: “Bases de datos”, “Sistemas Operativos”
- **Temas**
  - Ej: “Normalización”, “Procesos e hilos”
- **Nivel de dominio por tema (1–10)**
  - El usuario puede indicar cuánto cree que domina un tema del **1 al 10**
  - Esto sirve como referencia rápida y para analizar progreso con el tiempo
- **Registro de estudio**
  - Guardar que has estudiado algo (sesión)
  - Opcionalmente registrar duración, notas y cómo fue la sesión
- **Repasos programados**
  - El sistema genera repasos automáticos tras estudiar un tema
  - Muestra cada día qué toca repasar
- **Resultado del repaso**
  - Al completar un repaso, el usuario puede indicar si le fue:
    - **bien**
    - **regular**
    - **mal**
  - Esto ayuda a tener un historial realista del aprendizaje, no solo “he repasado”

La idea es que el módulo funcione como “tu sistema de estudio diario”.

---

### ¿Qué NO incluye el MVP? (a propósito)
Para mantener el foco:
- calendario completo
- deporte
- nutrición
- integraciones externas
- funciones avanzadas
- gamificación compleja

Todo eso se construye después, sobre una base ya útil.

---

### Cómo está pensado para crecer
El MVP ya establece:
- un centro (“Hoy”)
- un módulo funcional (Estudios)
- y un estilo de trabajo repetible para añadir módulos después

Después del MVP, el crecimiento natural es:
1) mejorar el Dashboard “Hoy”
2) añadir Calendario / Agenda
3) añadir Deporte
4) añadir Nutrición
5) expandir módulos y conexiones entre ellos

---

### Resultado esperado del MVP
Cuando el MVP esté listo, LifeOS debe permitirte:
- organizar tus estudios por planes/asignaturas/temas
- registrar lo que estudias y cómo te ha ido
- ver automáticamente qué debes repasar hoy
- usar el sistema a diario sin fricción

Y desde ahí, ya es mucho más fácil y realista convertir LifeOS en el sistema completo.

---