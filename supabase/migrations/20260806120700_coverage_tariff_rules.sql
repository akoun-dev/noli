-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table coverage_tariff_rules (règles de tarification) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.coverage_tariff_rules (
  id bigint generated always as identity primary key,
  coverage_id bigint not null references public.coverages (id) on delete cascade,
  vehicle_category text, -- VP, VT, etc.
  min_fiscal_power integer,
  max_fiscal_power integer,
  min_vehicle_value double precision,
  max_vehicle_value double precision,
  fuel_type text, -- ESSENCE | DIESEL
  formula_name text, -- Formule 1, 2, 3 (IC/IPT)
  base_rate double precision, -- taux en %
  fixed_amount double precision, -- montant fixe FCFA
  min_amount double precision,
  max_amount double precision,
  conditions text not null default '{}', -- JSON
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coverage_tariff_rules is
  'Grilles de tarification d''une garantie selon véhicule, puissance fiscale, valeur, carburant ou formule.';

create trigger coverage_tariff_rules_set_updated_at
  before update on public.coverage_tariff_rules
  for each row execute function public.set_updated_at();

alter table public.coverage_tariff_rules enable row level security;

create index coverage_tariff_rules_coverage_id_idx on public.coverage_tariff_rules (coverage_id);

-- RLS : lecture publique du catalogue
create policy "Everyone can view tariff rules"
on public.coverage_tariff_rules
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create tariff rules"
on public.coverage_tariff_rules
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update tariff rules"
on public.coverage_tariff_rules
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete tariff rules"
on public.coverage_tariff_rules
for delete
to authenticated
using (public.is_admin());
