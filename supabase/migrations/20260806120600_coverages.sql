-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table coverages (garanties) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Colonnes de calcul structurées à plat (remplaçant l'ancien JSON plat).
-- Catalogue public : lecture libre, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.coverages (
  id bigint generated always as identity primary key,
  code text not null unique,
  type text not null, -- RC, INCENDIE, VOL, etc.
  name text not null,
  description text,
  calculation_type text not null default 'FIXED_AMOUNT', -- FREE | FIXED_AMOUNT | VARIABLE_BASED | MATRIX_BASED
  category_id bigint references public.coverage_categories (id),
  insurer_id bigint not null references public.insurers (id),
  is_mandatory boolean not null default false,
  is_optional boolean not null default false,
  conditions text not null default '{}', -- JSON : conditions d'application
  is_active boolean not null default true,
  display_order integer not null default 0,
  variable_source text, -- NEW_VALUE | VENAL_VALUE | FISCAL_POWER
  rate_percent double precision, -- taux en % (VARIABLE_BASED)
  conditioned_by_new_value boolean not null default false,
  new_value_threshold double precision, -- seuil valeur à neuf
  rate_below_threshold double precision, -- taux si VN <= seuil
  rate_above_threshold double precision, -- taux si VN > seuil
  fixed_amount double precision, -- montant fixe (FIXED_AMOUNT)
  pack_price_reduced double precision, -- prix réduit en pack
  capital double precision, -- capital (ex : avance sur recours)
  min_amount double precision, -- prime minimale
  max_amount double precision, -- prime maximale
  matrix_dimension text, -- FISCAL_POWER | FORMULA | VEHICLE_CATEGORY | etc.
  requires_guarantee text, -- code de garantie requise (ex : BDG)
  metadata text not null default '{}', -- JSON : config avancée (matrices, franchises)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coverages_calculation_type_check check (
    calculation_type in ('FREE', 'FIXED_AMOUNT', 'VARIABLE_BASED', 'MATRIX_BASED')
  )
);

comment on table public.coverages is
  'Garanties d''assurance paramétrables (calcul de prime fixe, variable, par matrice).';

create trigger coverages_set_updated_at
  before update on public.coverages
  for each row execute function public.set_updated_at();

alter table public.coverages enable row level security;

create index coverages_category_id_idx on public.coverages (category_id);
create index coverages_insurer_id_idx on public.coverages (insurer_id);

-- RLS : lecture publique du catalogue
create policy "Everyone can view coverages"
on public.coverages
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create coverages"
on public.coverages
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update coverages"
on public.coverages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete coverages"
on public.coverages
for delete
to authenticated
using (public.is_admin());
