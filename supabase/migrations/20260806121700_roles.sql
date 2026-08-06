-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table roles (rôles personnalisés) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Lecture pour les utilisateurs connectés, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.roles is
  'Rôles personnalisés attribuables aux utilisateurs (en plus de USER/INSURER/ADMIN).';

create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

alter table public.roles enable row level security;

-- RLS : lecture pour les utilisateurs connectés
create policy "Authenticated users can view roles"
on public.roles
for select
to authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create roles"
on public.roles
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update roles"
on public.roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete roles"
on public.roles
for delete
to authenticated
using (public.is_admin());
