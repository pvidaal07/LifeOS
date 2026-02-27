# 🧠 LifeOS

> Tu sistema operativo personal — organiza tu vida en un solo lugar.

LifeOS es una plataforma modular que conecta planificación diaria con tus áreas clave: estudio, deporte, nutrición y más. El MVP se centra en el **módulo de Estudios** con un sistema inteligente de repasos.

---

## 📐 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS (TypeScript) |
| **Base de datos** | PostgreSQL 16 (Docker) |
| **ORM** | Prisma |
| **Frontend** | React + Vite (TypeScript) |
| **UI** | shadcn/ui + Tailwind CSS |
| **State** | Zustand + TanStack Query |
| **Auth** | JWT (access + refresh tokens) |
| **API Docs** | Swagger (auto-generado) |
| **Testing** | Vitest |
| **Infra** | Docker Compose |

---

## 🚀 Inicio Rápido (Desarrollo)

### Requisitos previos
- **Node.js** v20+
- **Docker** y **Docker Compose**
- **npm** v9+

### 1. Clonar y configurar variables de entorno

```bash
git clone <tu-repo-url> LifeOS
cd LifeOS

# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
```

### 2. Levantar la base de datos

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL** en `localhost:5432`
- **pgAdmin** en `localhost:5050` (admin@lifeos.dev / admin)

### 3. Instalar dependencias y configurar backend

```bash
cd backend
npm install

# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# (Opcional) Cargar datos de ejemplo
npm run prisma:seed
```

### 4. Instalar dependencias del frontend

```bash
cd ../frontend
npm install

# (Opcional) Añadir componentes shadcn/ui
npx shadcn-ui@latest add button card input label
```

### 5. Arrancar en desarrollo

En **dos terminales**:

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
```

- 🖥️ **Frontend**: http://localhost:5173
- 🔧 **API**: http://localhost:3000/api/v1
- 📚 **Swagger**: http://localhost:3000/api/docs
- 🗄️ **pgAdmin**: http://localhost:5050

### Usuario demo
```
Email:    demo@lifeos.dev
Password: demo1234
```

---

## 🏗️ Estructura del Proyecto

```
LifeOS/
├── docker-compose.yml          # PostgreSQL + pgAdmin (desarrollo)
├── docker-compose.prod.yml     # Todo en Docker (producción)
├── .env.example
│
├── backend/                    # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos de la base de datos
│   │   └── seed.ts             # Datos iniciales
│   ├── src/
│   │   ├── common/             # Guards, interceptors, DTOs
│   │   ├── config/             # Configuración centralizada
│   │   ├── prisma/             # Servicio Prisma (global)
│   │   └── modules/
│   │       ├── auth/           # Login, registro, JWT
│   │       ├── users/          # Perfil, settings, módulos
│   │       ├── studies/        # MÓDULO ESTUDIOS (MVP)
│   │       │   ├── plans/      # Planes de estudio
│   │       │   ├── subjects/   # Asignaturas
│   │       │   ├── topics/     # Temas + dominio
│   │       │   ├── sessions/   # Sesiones de estudio
│   │       │   └── reviews/    # Repasos + algoritmo
│   │       └── dashboard/      # Panel "Hoy"
│   └── Dockerfile
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── api/                # Clientes API (axios)
│   │   ├── components/layout/  # Sidebar, Header, Layout
│   │   ├── hooks/              # Custom hooks (useAuth)
│   │   ├── pages/              # Páginas
│   │   ├── routes/             # Configuración de rutas
│   │   ├── stores/             # Estado global (Zustand)
│   │   └── types/              # Tipos TypeScript
│   └── Dockerfile
│
├── nginx/                      # Reverse proxy (producción)
└── docs/
    └── README.md               # Visión completa del proyecto
```

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 🚢 Despliegue en Producción (VPS)

```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción (JWT_SECRET, DB_PASSWORD, etc.)

# Levantar todo
docker compose -f docker-compose.prod.yml up -d --build
```

Esto levanta: PostgreSQL + Backend (con migraciones) + Frontend + Nginx en el puerto 80.

---

## 📋 API Endpoints (MVP)

| Método | Ruta | Descripción |
|--------|------|-------------|
| **Auth** | | |
| POST | `/api/v1/auth/register` | Registrar usuario |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/refresh` | Refrescar token |
| POST | `/api/v1/auth/logout` | Cerrar sesión |
| **Users** | | |
| GET | `/api/v1/users/me` | Obtener perfil |
| PATCH | `/api/v1/users/me` | Actualizar perfil |
| PATCH | `/api/v1/users/me/settings` | Actualizar configuración |
| PUT | `/api/v1/users/me/modules` | Configurar módulos del menú |
| **Estudios** | | |
| GET/POST | `/api/v1/studies/plans` | Planes de estudio |
| GET/PATCH/DELETE | `/api/v1/studies/plans/:id` | Plan específico |
| GET/POST | `/api/v1/studies/subjects` | Asignaturas |
| GET/PATCH/DELETE | `/api/v1/studies/subjects/:id` | Asignatura específica |
| GET/POST | `/api/v1/studies/topics` | Temas |
| GET/PATCH/DELETE | `/api/v1/studies/topics/:id` | Tema específico |
| POST | `/api/v1/studies/sessions` | Registrar sesión de estudio |
| GET | `/api/v1/studies/sessions/recent` | Sesiones recientes |
| **Repasos** | | |
| GET | `/api/v1/studies/reviews/pending` | Repasos pendientes |
| POST | `/api/v1/studies/reviews/:id/complete` | Completar repaso |
| POST | `/api/v1/studies/reviews/:id/skip` | Saltar repaso |
| **Dashboard** | | |
| GET | `/api/v1/dashboard` | Panel "Hoy" completo |

---

## 📄 Licencia

MIT
