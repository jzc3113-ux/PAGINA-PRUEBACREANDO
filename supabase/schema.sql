-- Schema mínimo del MVP (idempotente, re-ejecutable y merge-safe)
-- Extensiones
create extension if not exists "pgcrypto";

-- Roles de app (idempotente)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('admin', 'user');
  end if;
end
$$;

-- Perfil de usuario (1 a 1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Publicaciones
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grupos internos
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Miembros de grupos (N a N)
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Documentos (metadatos; el archivo físico vive en Storage)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Trigger para crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper para validar admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.documents enable row level security;

-- Recrear policies para que el script sea re-ejecutable

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

drop policy if exists "posts_read_authenticated" on public.posts;
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
drop policy if exists "posts_delete_own_or_admin" on public.posts;

drop policy if exists "groups_read_authenticated" on public.groups;
drop policy if exists "groups_insert_authenticated" on public.groups;
drop policy if exists "groups_update_admin" on public.groups;

drop policy if exists "group_members_read_authenticated" on public.group_members;
drop policy if exists "group_members_insert_admin" on public.group_members;
drop policy if exists "group_members_delete_admin" on public.group_members;
drop policy if exists "group_members_insert_self_or_admin" on public.group_members;
drop policy if exists "group_members_delete_self_or_admin" on public.group_members;

drop policy if exists "documents_read_authenticated" on public.documents;
drop policy if exists "documents_insert_owner" on public.documents;
drop policy if exists "documents_update_owner_or_admin" on public.documents;
drop policy if exists "documents_delete_owner_or_admin" on public.documents;
drop policy if exists "documents_read_owner_group_or_admin" on public.documents;
drop policy if exists "documents_insert_owner_group_member_or_admin" on public.documents;

-- Policies: profiles
create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Policies: posts
create policy "posts_read_authenticated" on public.posts
for select to authenticated using (true);

create policy "posts_insert_own" on public.posts
for insert to authenticated with check (author_id = auth.uid());

create policy "posts_update_own_or_admin" on public.posts
for update to authenticated using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy "posts_delete_own_or_admin" on public.posts
for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- Policies: groups
create policy "groups_read_authenticated" on public.groups
for select to authenticated using (true);

create policy "groups_insert_authenticated" on public.groups
for insert to authenticated with check (created_by = auth.uid() or public.is_admin());

create policy "groups_update_admin" on public.groups
for update to authenticated using (public.is_admin())
with check (public.is_admin());

-- Policies: group_members
create policy "group_members_read_authenticated" on public.group_members
for select to authenticated using (true);

create policy "group_members_insert_self_or_admin" on public.group_members
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy "group_members_delete_self_or_admin" on public.group_members
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Policies: documents
create policy "documents_read_owner_group_or_admin" on public.documents
for select to authenticated using (
  owner_id = auth.uid()
  or public.is_admin()
  or (
    group_id is not null
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = documents.group_id
        and gm.user_id = auth.uid()
    )
  )
);

create policy "documents_insert_owner_group_member_or_admin" on public.documents
for insert to authenticated with check (
  owner_id = auth.uid()
  and (
    group_id is null
    or public.is_admin()
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = documents.group_id
        and gm.user_id = auth.uid()
    )
  )
);

create policy "documents_update_owner_or_admin" on public.documents
for update to authenticated using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "documents_delete_owner_or_admin" on public.documents
for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- Storage (bucket para documentos)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_storage_select" on storage.objects;
drop policy if exists "documents_storage_insert" on storage.objects;

create policy "documents_storage_select" on storage.objects
for select to authenticated
using (bucket_id = 'documents');

create policy "documents_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
