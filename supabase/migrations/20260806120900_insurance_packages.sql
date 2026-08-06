-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table insurance_packages (packs d'assurance) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.insurance_packages (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  base_price integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.insurance_packages is
  'Packs regroupant plusieurs garanties avec un prix de base.';

create trigger insurance_packages_set_updated_at
  before update on public.insurance_packages
  for each row execute function public.set_updated_at();

alter table public.insurance_packages enable row level security;

-- RLS : lecture publique du catalogue
create policy "Everyone can view insurance packages"
on public.insurance_packages
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create insurance packages"
on public.insurance_packages
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update insurance packages"
on public.insurance_packages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete insurance packages"
on public.insurance_packages
for delete
to authenticated
using (public.is_admin());
