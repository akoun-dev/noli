-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table quote_coverages (lignes de devis) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Accès hérité du devis parent (propriétaire ou assureur de l'offre).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.quote_coverages (
  id bigint generated always as identity primary key,
  quote_id bigint not null references public.quotes (id) on delete cascade,
  coverage_id bigint not null references public.coverages (id),
  tariff_rule_id bigint references public.coverage_tariff_rules (id),
  premium_amount integer not null,
  calculation_parameters text not null default '{}', -- JSON
  is_included boolean not null default true,
  is_mandatory boolean not null default false,
  created_at timestamptz not null default now(),
  constraint quote_coverages_quote_coverage_key unique (quote_id, coverage_id)
);

comment on table public.quote_coverages is
  'Garanties et primes détaillées d''un devis (ligne de calcul par garantie).';

alter table public.quote_coverages enable row level security;

create index quote_coverages_coverage_id_idx on public.quote_coverages (coverage_id);

-- RLS : lecture des lignes de ses devis (client)
create policy "Users can view lines of their quotes"
on public.quote_coverages
for select
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and (select auth.uid()) = quotes.user_id
  )
);

-- RLS : lecture des lignes des devis liés à leurs offres (assureur)
create policy "Insurers can view lines of quotes on their offers"
on public.quote_coverages
for select
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and exists (
        select 1
        from public.insurance_offers
        where insurance_offers.id = quotes.offer_id
          and exists (
            select 1
            from public.insurer_accounts
            where insurer_accounts.profile_id = (select auth.uid())
              and insurer_accounts.insurer_id = insurance_offers.insurer_id
          )
      )
  )
);

-- RLS : lecture de toutes les lignes (admin)
create policy "Admins can view all quote lines"
on public.quote_coverages
for select
to authenticated
using (public.is_admin());

-- RLS : création de lignes sur ses devis (client)
create policy "Users can create lines on their quotes"
on public.quote_coverages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and (select auth.uid()) = quotes.user_id
  )
);

-- RLS : création de lignes réservée aux admins
create policy "Admins can create quote lines"
on public.quote_coverages
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification des lignes de ses devis (client)
create policy "Users can update lines on their quotes"
on public.quote_coverages
for update
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and (select auth.uid()) = quotes.user_id
  )
)
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and (select auth.uid()) = quotes.user_id
  )
);

-- RLS : modification des lignes réservée aux admins
create policy "Admins can update quote lines"
on public.quote_coverages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression des lignes de ses devis (client)
create policy "Users can delete lines on their quotes"
on public.quote_coverages
for delete
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_coverages.quote_id
      and (select auth.uid()) = quotes.user_id
  )
);

-- RLS : suppression des lignes réservée aux admins
create policy "Admins can delete quote lines"
on public.quote_coverages
for delete
to authenticated
using (public.is_admin());
