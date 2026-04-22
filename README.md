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
  - script actualizado para ser re-ejecutable (`drop policy if exists` + creación idempotente de tipo).

### 🧱 Existe pero está en scaffold/placeholder

Pantallas base con contenido mínimo (compilan, pero sin lógica de negocio completa):
- `/dashboard`
- `/admin`

Esto está alineado con el requerimiento de funcionalidad primero y base para iterar por módulos.

### ⏳ Pendiente para siguiente fase (no bloquea la base)

- Refinamientos de UX para grupos/documentos/perfil/publicaciones.
- Refinamientos de UX para gestión de usuarios/roles en `/admin/users`.
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
```

## 2) Esquema mínimo de base de datos MVP

Archivo: `supabase/schema.sql`

Tablas mínimas:
- `profiles` (perfil + rol)
- `posts` (publicaciones)
- `groups` (grupos)
- `group_members` (miembros de grupos)
- `documents` (metadatos de archivos)

Además incluye:
- tipo `app_role` con valores `admin` y `user`
- trigger para crear perfil automático desde `auth.users`
- RLS habilitado en todas las tablas
- políticas mínimas para lectura/escritura según ownership y admin

## 3) Rutas principales (App Router)

Públicas:
- `/login`

Usuario autenticado:
- `/dashboard`
- `/perfil`
- `/publicaciones`
- `/grupos`
- `/grupos/[id]`
- `/documentos`

Administrador (solo rol admin):
- `/admin`
- `/admin/users`

## 4) Autenticación

- Supabase Auth con email/contraseña (`signInWithPassword`).
- Sesión manejada con `@supabase/ssr` para cliente, server y middleware.
- Logout con server action (`app/actions/auth.ts`).

## 5) Manejo de roles

- Rol persistido en `profiles.role` (`admin` | `user`).
- En `middleware.ts`:
  - sin sesión => redirige a `/login`
  - con sesión en `/login` => redirige a `/dashboard`
  - acceso `/admin*` valida rol admin y redirige a `/dashboard` si no cumple

## 6) Pantallas base funcionales

Incluidas páginas simples para:
- login
- dashboard usuario
- perfil
- publicaciones
- grupos
- documentos
- dashboard admin
- gestión básica admin

## Relación entre tablas

- `profiles (1) -> (N) posts`
- `profiles (1) -> (N) groups.created_by`
- `profiles (N) <-> (N) groups` mediante `group_members`
- `profiles (1) -> (N) documents`
- `groups (1) -> (N) documents` (opcional por documento)

## Checklist final de prueba local

### 1) Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 2) Cómo correr el proyecto

```bash
npm install
npm run dev
```

### 3) Aplicar schema SQL

- En Supabase SQL Editor, ejecutar `supabase/schema.sql` completo.

### 4) Cómo crear el primer admin

1. Crear usuario desde `/login` si tienes sign-up habilitado en tu proyecto Supabase,
   o crearlo desde Supabase Auth dashboard.
2. Ejecutar en SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

### 5) Validar rutas user/admin

- Sin sesión:
  - entrar a `/dashboard` => debe redirigir a `/login`.
- Con usuario `user`:
  - entrar a `/dashboard` => permitido.
  - entrar a `/admin` => redirige a `/dashboard`.
- Con usuario `admin`:
  - entrar a `/admin` y `/admin/users` => permitido.

## Orden recomendado de implementación

1. **Infra**: proyecto Supabase + Vercel + variables.
2. **DB**: ejecutar `supabase/schema.sql` y validar RLS.
3. **Auth**: probar login/logout con usuarios reales.
4. **Roles**: marcar primer admin y validar rutas.
5. **Módulo usuario**: perfil + CRUD publicaciones.
6. **Módulo grupos**: creación y membresías.
7. **Módulo documentos**: upload/lista en Storage.
8. **Módulo admin**: gestión de usuarios/roles.
9. **Hardening**: validaciones, logs y UX.

## Decisiones técnicas a cerrar antes del siguiente módulo

1. **Método de alta de usuarios**
   - Autoregistro o creación por admin.
2. **Política de documentos**
   - Bucket público/privado y reglas por grupo.
3. **Alcance de admin panel**
   - Moderación solamente o edición completa.
4. **Modelo de grupos**
   - Abiertos o por invitación/aprobación.
5. **Estrategia de despliegue**
   - `dev/staging/prod` o sólo `prod` al inicio.
