-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table quotes (devis) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Le client propriétaire et l'assureur de l'offre liée accèdent au devis.
-- Les écritures du client sont limitées à ses propres devis ; l'assureur ne
-- peut que modifier (ex : statut), pas supprimer. Admin : accès complet.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.quotes (
  id bigint generated always as identity primary key,
  reference text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  category_id bigint references public.insurance_categories (id),
  offer_id bigint references public.insurance_offers (id),
  status text not null default 'DRAFT', -- DRAFT | PENDING | APPROVED | REJECTED
  estimated_price integer,
  final_price double precision,
  notes text,
  vehicle_data text not null default '{}', -- JSON
  personal_data text not null default '{}', -- JSON
  coverage_requirements text not null default '{}', -- JSON
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_status_check check (status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'))
);

comment on table public.quotes is
  'Devis d''assurance émis par un utilisateur pour une offre donnée.';

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;

create index quotes_user_id_idx on public.quotes (user_id);
create index quotes_offer_id_idx on public.quotes (offer_id);
create index quotes_status_idx on public.quotes (status);
create index quotes_category_id_idx on public.quotes (category_id);

-- RLS : lecture de ses propres devis (client)
create policy "Users can view their own quotes"
on public.quotes
for select
to authenticated
using ((select auth.uid()) = user_id);

-- RLS : lecture des devis liés à leurs offres (assureur)
create policy "Insurers can view quotes on their offers"
on public.quotes
for select
to authenticated
using (
  exists (
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
);

-- RLS : lecture de tous les devis (admin)
create policy "Admins can view all quotes"
on public.quotes
for select
to authenticated
using (public.is_admin());

-- RLS : création de ses propres devis (client)
create policy "Users can create their own quotes"
on public.quotes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- RLS : création de devis réservée aux admins
create policy "Admins can create quotes"
on public.quotes
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification de ses propres devis (client)
create policy "Users can update their own quotes"
on public.quotes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- RLS : modification du statut des devis liés à leurs offres (assureur)
create policy "Insurers can update quotes on their offers"
on public.quotes
for update
to authenticated
using (
  exists (
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
with check (
  exists (
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
);

-- RLS : modification de tous les devis (admin)
create policy "Admins can update quotes"
on public.quotes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression de ses propres devis (client)
create policy "Users can delete their own quotes"
on public.quotes
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- RLS : suppression de tous les devis (admin)
create policy "Admins can delete quotes"
on public.quotes
for delete
to authenticated
using (public.is_admin());
