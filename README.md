# Intranet social MVP (base técnica)

Base inicial para una intranet social simple con:
- Next.js (App Router)
- Supabase (Auth + Postgres + Storage)
- Despliegue esperado en Vercel
- Control de código en GitHub

## Estado técnico validado (repositorio actual)

### ✅ Implementado y funcional (base operativa)

- **Protección de rutas por sesión y rol** en `middleware.ts`:
  - si no hay sesión redirige a `/login`
  - si hay sesión y entra a `/login` redirige a `/dashboard`
  - si intenta entrar a `/admin*` valida rol en `profiles.role` y bloquea a no-admin.
- **Auth con Supabase**:
  - login email/password con `signInWithPassword`
  - logout con server action y `supabase.auth.signOut()`.
- **Clientes Supabase separados**:
  - browser (`lib/supabase/browser.ts`)
  - server (`lib/supabase/server.ts`)
  - middleware (`lib/supabase/middleware.ts`).
- **Modelo de roles** (`admin` / `user`) consultado desde BD en `lib/auth/roles.ts`.
- **Layouts separados** para usuario y admin con navegación y logout.
- **Esquema SQL mínimo operativo** con:
  - roles (`app_role`), tablas, trigger de `profiles`, helper `is_admin()`, RLS y policies.
  - script actualizado para ser **re-ejecutable** (`drop policy if exists` + creación idempotente de tipo).

### 🧱 Existe pero está en scaffold/placeholder

Pantallas base con contenido mínimo (compilan, pero sin lógica de negocio completa):
- `/dashboard`
- `/perfil`
- `/publicaciones`
- `/grupos`
- `/documentos`
- `/admin`
- `/admin/users`

Esto está alineado con el requerimiento de funcionalidad primero y base para iterar por módulos.

### ⏳ Pendiente para siguiente fase (no bloquea la base)

- CRUD real de perfil/publicaciones/grupos/documentos.
- Gestión real de usuarios/roles desde `/admin/users`.
- Integración completa de Supabase Storage en UI (ahora sólo está modelado en DB).
- Métricas reales en dashboard admin (actualmente placeholder).
- E2E/manual QA completo en entorno con `npm install` disponible.

## 1) Estructura inicial del proyecto

```text
.
├─ app/
│  ├─ (user)/
│  │  ├─ dashboard/page.tsx
│  │  ├─ perfil/page.tsx
│  │  ├─ publicaciones/page.tsx
│  │  ├─ grupos/page.tsx
│  │  ├─ documentos/page.tsx
│  │  └─ layout.tsx
│  ├─ (admin)/
│  │  ├─ admin/page.tsx
│  │  ├─ admin/users/page.tsx
│  │  └─ layout.tsx
│  ├─ actions/auth.ts
│  ├─ components/sign-out-button.tsx
│  ├─ login/page.tsx
│  ├─ layout.tsx
│  └─ page.tsx
├─ lib/
│  ├─ auth/roles.ts
│  └─ supabase/
│     ├─ browser.ts
│     ├─ env.ts
│     ├─ middleware.ts
│     └─ server.ts
├─ supabase/
│  └─ schema.sql
├─ middleware.ts
├─ .env.example
└─ README.md
