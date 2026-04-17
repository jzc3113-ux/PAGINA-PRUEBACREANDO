# Intranet social MVP (base técnica)

Base inicial para una intranet social simple con:
- Next.js (App Router)
- Supabase (Auth + Postgres + Storage)
- Despliegue esperado en Vercel
- Control de código en GitHub

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

## Orden recomendado de implementación

1. **Infra**: crear proyecto Supabase, variables de entorno y proyecto en Vercel.
2. **DB**: ejecutar `supabase/schema.sql` y validar RLS.
3. **Auth**: probar login/logout con usuarios reales.
4. **Roles**: marcar un primer admin y validar rutas protegidas.
5. **Módulo usuario**: perfil + CRUD básico de publicaciones.
6. **Módulo grupos**: crear grupos y membresías.
7. **Módulo documentos**: bucket en Storage + upload + lista de metadatos.
8. **Módulo admin**: vista de usuarios y cambio de roles.
9. **Hardening**: validaciones, logs, observabilidad y ajustes UX.

## Decisiones técnicas a cerrar antes del siguiente módulo

1. **Método de alta de usuarios**
   - Autoregistro o creación por admin.
2. **Política de documentos**
   - Bucket público/privado y reglas de acceso por grupo.
3. **Alcance de admin panel**
   - Si admin podrá editar publicaciones/grupos o solo moderar.
4. **Modelo de grupos**
   - Grupos abiertos o por invitación/aprobación.
5. **Estrategia de despliegue**
   - Ambientes `dev/staging/prod` desde el inicio o solo `prod`.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Comandos

```bash
npm install
npm run dev
```
