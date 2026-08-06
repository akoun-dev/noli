-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table package_coverages (liaison pack <-> garantie) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Lecture publique, écriture admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.package_coverages (
  id bigint generated always as identity primary key,
  package_id bigint not null references public.insurance_packages (id) on delete cascade,
  coverage_id bigint not null references public.coverages (id) on delete cascade,
  is_mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  constraint package_coverages_package_coverage_key unique (package_id, coverage_id)
);

comment on table public.package_coverages is
  'Garanties incluses dans chaque pack (lien insurance_packages <-> coverages).';

alter table public.package_coverages enable row level security;

create index package_coverages_coverage_id_idx on public.package_coverages (coverage_id);

-- RLS : lecture publique
create policy "Everyone can view package coverages"
on public.package_coverages
for select
to anon, authenticated
using (true);

-- RLS : création réservée aux admins
create policy "Admins can create package coverages"
on public.package_coverages
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update package coverages"
on public.package_coverages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete package coverages"
on public.package_coverages
for delete
to authenticated
using (public.is_admin());
