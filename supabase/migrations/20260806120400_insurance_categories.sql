-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table insurance_categories (catégories de produits) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.insurance_categories (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.insurance_categories is
  'Catégories de produits d''assurance (ex : Automobile, Moto, Habitation).';

create trigger insurance_categories_set_updated_at
  before update on public.insurance_categories
  for each row execute function public.set_updated_at();

alter table public.insurance_categories enable row level security;

-- RLS : lecture publique du catalogue
create policy "Everyone can view insurance categories"
on public.insurance_categories
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create insurance categories"
on public.insurance_categories
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update insurance categories"
on public.insurance_categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete insurance categories"
on public.insurance_categories
for delete
to authenticated
using (public.is_admin());
