-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table permissions + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Lecture pour les utilisateurs connectés, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.permissions (
  id bigint generated always as identity primary key,
  code text not null unique, -- settings.view | users.create | offers.delete | ...
  name text not null,
  category text not null, -- settings | users | offers | quotes | insurers | coverages | backups | audit | roles
  created_at timestamptz not null default now()
);

comment on table public.permissions is
  'Permissions granulaires pouvant être accordées aux rôles personnalisés.';

alter table public.permissions enable row level security;

-- RLS : lecture pour les utilisateurs connectés
create policy "Authenticated users can view permissions"
on public.permissions
for select
to authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create permissions"
on public.permissions
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update permissions"
on public.permissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete permissions"
on public.permissions
for delete
to authenticated
using (public.is_admin());
