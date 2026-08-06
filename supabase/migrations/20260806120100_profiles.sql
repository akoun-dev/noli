-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table profiles (utilisateurs) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- L'id est le même que celui de auth.users : c'est le pattern Supabase
-- standard, il permet d'utiliser auth.uid() dans les politiques RLS.
-- Le mot de passe n'est jamais stocké ici : il est géré par Supabase Auth.
-- RLS : un utilisateur ne voit/gère que son propre profil ; les admins gèrent
-- tout. Aucune politique pour anon : le profil n'est pas public.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'USER', -- USER | INSURER | ADMIN
  first_name text,
  last_name text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('USER', 'INSURER', 'ADMIN'))
);

comment on table public.profiles is
  'Utilisateurs de la plateforme Noli (client, assureur ou admin), liés à auth.users.';

-- Vérifie si l'utilisateur courant est admin (rôle ADMIN actif dans profiles).
-- security definer : contourne la RLS de profiles pour éviter une récursion
-- infinie (la politique de profiles appelle elle-même cette fonction).
-- search_path figé : évite le hijacking du schéma.
-- La sous-requête (select auth.uid()) est planifiée une seule fois (initPlan).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'ADMIN'
      and is_active = true
  );
$$;

-- création automatique du profil (après inscription Auth)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- mise à jour automatique de updated_at
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- index d'aide aux recherches par rôle (email déjà indexé par unique)
create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- RLS : lecture de son propre profil
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- RLS : lecture de tous les profils (admin)
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- RLS : création de son propre profil
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- RLS : modification de son propre profil
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- RLS : modification de tous les profils (admin)
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression de son propre profil
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

-- RLS : suppression de tous les profils (admin)
create policy "Admins can delete all profiles"
on public.profiles
for delete
to authenticated
using (public.is_admin());
