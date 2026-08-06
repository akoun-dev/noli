-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table contracts (contrats d'assurance) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Un contrat naît lorsqu'un assureur approuve un devis. Il lie le client
-- (profile_id) à l'offre et à la compagnie d'assurance.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.contracts (
  id bigint generated always as identity primary key,
  reference text not null unique, -- NOLI-CON-XXXXXX
  quote_id bigint unique references public.quotes (id) on delete set null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  insurer_id bigint not null references public.insurers (id) on delete cascade,
  offer_id bigint references public.insurance_offers (id) on delete set null,
  status text not null default 'ACTIVE', -- ACTIVE | EXPIRED | CANCELLED
  start_date date not null default current_date,
  end_date date,
  premium double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_status_check check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED'))
);

comment on table public.contracts is
  'Contrats d''assurance souscrits à partir d''un devis approuvé.';

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

alter table public.contracts enable row level security;

create index contracts_profile_id_idx on public.contracts (profile_id);
create index contracts_insurer_id_idx on public.contracts (insurer_id);
create index contracts_offer_id_idx on public.contracts (offer_id);
create index contracts_status_idx on public.contracts (status);

-- RLS : lecture de ses propres contrats (client)
create policy "Users can view their own contracts"
on public.contracts
for select
to authenticated
using ((select auth.uid()) = profile_id);

-- RLS : lecture des contrats liés à leurs offres (assureur)
create policy "Insurers can view contracts on their offers"
on public.contracts
for select
to authenticated
using (
  exists (
    select 1
    from public.insurance_offers
    where insurance_offers.id = contracts.offer_id
      and exists (
        select 1
        from public.insurer_accounts
        where insurer_accounts.profile_id = (select auth.uid())
          and insurer_accounts.insurer_id = insurance_offers.insurer_id
      )
  )
);

-- RLS : lecture de tous les contrats (admin)
create policy "Admins can view all contracts"
on public.contracts
for select
to authenticated
using (public.is_admin());

-- RLS : création de contrats sur leurs offres (assureur)
create policy "Insurers can create contracts on their offers"
on public.contracts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.insurance_offers
    where insurance_offers.id = contracts.offer_id
      and exists (
        select 1
        from public.insurer_accounts
        where insurer_accounts.profile_id = (select auth.uid())
          and insurer_accounts.insurer_id = insurance_offers.insurer_id
      )
  )
);

-- RLS : création de contrats réservée aux admins
create policy "Admins can create contracts"
on public.contracts
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification des contrats liés à leurs offres (assureur)
create policy "Insurers can update contracts on their offers"
on public.contracts
for update
to authenticated
using (
  exists (
    select 1
    from public.insurance_offers
    where insurance_offers.id = contracts.offer_id
      and exists (
        select 1
        from public.insurer_accounts
        where insurer_accounts.profile_id = (select auth.uid())
          and insurer_accounts.insurer_id = insurance_offers.insurer_id
      )
  )
)
with check (
  exists (
    select 1
    from public.insurance_offers
    where insurance_offers.id = contracts.offer_id
      and exists (
        select 1
        from public.insurer_accounts
        where insurer_accounts.profile_id = (select auth.uid())
          and insurer_accounts.insurer_id = insurance_offers.insurer_id
      )
  )
);

-- RLS : modification de tous les contrats (admin)
create policy "Admins can update contracts"
on public.contracts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete contracts"
on public.contracts
for delete
to authenticated
using (public.is_admin());
