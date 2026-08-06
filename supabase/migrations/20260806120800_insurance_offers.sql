-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table insurance_offers (offres d'assurance) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.insurance_offers (
  id bigint generated always as identity primary key,
  insurer_id bigint not null references public.insurers (id),
  category_id bigint references public.insurance_categories (id),
  name text not null,
  description text,
  price_min integer,
  price_max integer,
  coverage_amount integer,
  deductible integer not null default 0,
  features text not null default '[]', -- JSON string[]
  contract_type text, -- basic | third_party_plus | all_risks
  is_active boolean not null default true,
  fiscal_power_min integer,
  fiscal_power_max integer,
  fuel_types text not null default '[]', -- JSON string[] : ["essence","diesel"]
  new_value_min integer,
  new_value_max integer,
  venal_value_min integer,
  venal_value_max integer,
  vehicle_usage text not null default '[]', -- JSON string[] : ["personnel","professionnel","taxi","autre"]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.insurance_offers is
  'Offres d''assurance commercialisées par les assureurs, avec critères d''éligibilité véhicule.';

create trigger insurance_offers_set_updated_at
  before update on public.insurance_offers
  for each row execute function public.set_updated_at();

alter table public.insurance_offers enable row level security;

create index insurance_offers_insurer_id_idx on public.insurance_offers (insurer_id);
create index insurance_offers_category_id_idx on public.insurance_offers (category_id);

-- RLS : lecture publique du catalogue
create policy "Everyone can view insurance offers"
on public.insurance_offers
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create insurance offers"
on public.insurance_offers
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update insurance offers"
on public.insurance_offers
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete insurance offers"
on public.insurance_offers
for delete
to authenticated
using (public.is_admin());
