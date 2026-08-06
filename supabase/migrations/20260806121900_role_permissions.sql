-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table role_permissions (liaison rôle <-> permission) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Lecture pour les utilisateurs connectés, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.role_permissions (
  id bigint generated always as identity primary key,
  role_id bigint not null references public.roles (id) on delete cascade,
  permission_id bigint not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint role_permissions_role_permission_key unique (role_id, permission_id)
);

comment on table public.role_permissions is
  'Permissions accordées à chaque rôle (lien roles <-> permissions).';

alter table public.role_permissions enable row level security;

create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

-- RLS : lecture pour les utilisateurs connectés
create policy "Authenticated users can view role permissions"
on public.role_permissions
for select
to authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create role permissions"
on public.role_permissions
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update role permissions"
on public.role_permissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete role permissions"
on public.role_permissions
for delete
to authenticated
using (public.is_admin());
