-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table profile_roles (liaison profil <-> rôle personnalisé) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Chacun voit ses propres rôles ; l'écriture est admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profile_roles (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_id bigint not null references public.roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_roles_profile_role_key unique (profile_id, role_id)
);

comment on table public.profile_roles is
  'Rôles personnalisés attribués à chaque utilisateur (lien profiles <-> roles).';

alter table public.profile_roles enable row level security;

create index profile_roles_role_id_idx on public.profile_roles (role_id);

-- RLS : lecture de ses propres rôles
create policy "Users can view their own roles"
on public.profile_roles
for select
to authenticated
using ((select auth.uid()) = profile_id);

-- RLS : lecture de tous les rôles (admin)
create policy "Admins can view all profile roles"
on public.profile_roles
for select
to authenticated
using (public.is_admin());

-- RLS : attribution des rôles réservée aux admins
create policy "Admins can assign roles to profiles"
on public.profile_roles
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification des rôles réservée aux admins
create policy "Admins can update profile roles"
on public.profile_roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : retrait des rôles réservé aux admins
create policy "Admins can remove roles from profiles"
on public.profile_roles
for delete
to authenticated
using (public.is_admin());
