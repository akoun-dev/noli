-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table coverage_categories (catégories de garanties) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.coverage_categories (
  id bigint generated always as identity primary key,
  code text not null unique, -- RESPONSABILITE_CIVILE, INCENDIE, etc.
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coverage_categories is
  'Catégories de garanties d''assurance (ex : responsabilité civile, incendie).';

create trigger coverage_categories_set_updated_at
  before update on public.coverage_categories
  for each row execute function public.set_updated_at();

alter table public.coverage_categories enable row level security;

-- RLS : lecture publique du catalogue
create policy "Everyone can view coverage categories"
on public.coverage_categories
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create coverage categories"
on public.coverage_categories
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update coverage categories"
on public.coverage_categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete coverage categories"
on public.coverage_categories
for delete
to authenticated
using (public.is_admin());
