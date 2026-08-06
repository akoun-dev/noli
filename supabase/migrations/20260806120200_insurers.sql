-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table insurers (assureurs) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.insurers (
  id bigint generated always as identity primary key,
  code text not null unique, -- NOLIA, SUNU, NSIA, GNA, SAHAM
  name text not null,
  logo_url text,
  contact_email text,
  phone text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.insurers is
  'Compagnies d''assurance présentes sur la plateforme Noli.';

create trigger insurers_set_updated_at
  before update on public.insurers
  for each row execute function public.set_updated_at();

alter table public.insurers enable row level security;

-- RLS : lecture publique du catalogue
create policy "Everyone can view active insurers"
on public.insurers
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create insurers"
on public.insurers
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update insurers"
on public.insurers
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete insurers"
on public.insurers
for delete
to authenticated
using (public.is_admin());
