-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table reviews (avis clients sur les assureurs) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Un client peut noter (1–5) et commenter un assureur avec lequel il a interagi
-- (devis/contrat). Un seul avis par (client, assureur) — modifiable (upsert).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.reviews (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  insurer_id bigint not null references public.insurers (id) on delete cascade,
  rating int not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating between 1 and 5),
  constraint reviews_unique_per_insurer unique (profile_id, insurer_id)
);

comment on table public.reviews is
  'Avis clients (note 1–5 + commentaire) sur les compagnies d''assurance.';

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create index reviews_insurer_id_idx on public.reviews (insurer_id);
create index reviews_profile_id_idx on public.reviews (profile_id);

alter table public.reviews enable row level security;

-- RLS : un client gère (CRUD) uniquement ses propres avis.
create policy "Users manage their own reviews"
on public.reviews
for all
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

-- RLS : les avis sont lisibles par tout utilisateur authentifié (agrégats publics).
create policy "Reviews are readable by authenticated users"
on public.reviews
for select
to authenticated
using (true);

-- RLS : les admins gèrent tous les avis (modération).
create policy "Admins manage all reviews"
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
