-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table insurer_accounts (liaison profil <-> assureur) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- RLS : un assureur voit les liaisons le concernant ; l'écriture est admin
-- (sauf auto-liaison de son propre profil à l'inscription).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.insurer_accounts (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  insurer_id bigint not null references public.insurers (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint insurer_accounts_profile_insurer_key unique (profile_id, insurer_id)
);

comment on table public.insurer_accounts is
  'Associe un utilisateur (rôle INSURER) à la compagnie d''assurance qu''il gère.';

alter table public.insurer_accounts enable row level security;

create index insurer_accounts_insurer_id_idx on public.insurer_accounts (insurer_id);

-- RLS : lecture de ses propres liaisons
create policy "Insurers can view their own accounts"
on public.insurer_accounts
for select
to authenticated
using ((select auth.uid()) = profile_id);

-- RLS : lecture de toutes les liaisons (admin)
create policy "Admins can view all insurer accounts"
on public.insurer_accounts
for select
to authenticated
using (public.is_admin());

-- RLS : auto-liaison de son propre profil (inscription assureur)
create policy "Insurers can link their own profile"
on public.insurer_accounts
for insert
to authenticated
with check ((select auth.uid()) = profile_id);

-- RLS : création de liaisons réservée aux admins
create policy "Admins can create insurer accounts"
on public.insurer_accounts
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification des liaisons réservée aux admins
create policy "Admins can update insurer accounts"
on public.insurer_accounts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression des liaisons réservée aux admins
create policy "Admins can delete insurer accounts"
on public.insurer_accounts
for delete
to authenticated
using (public.is_admin());
