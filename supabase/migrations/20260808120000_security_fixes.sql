-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Correctifs de sécurité (audit 2026-08-08).
-- Forward-only : bloque les escalades de privilèges ADMIN et durcit
-- l'intégrité des données financières, sans casser les données existantes.
--
-- Rappel : l'application écrit via la service_role (RLS contournée). Les
-- triggers ci-dessous distinguent donc deux contextes :
--   - auth.uid() IS NULL  → service_role (routes serveur de confiance) : libre.
--   - auth.uid() IS NOT NULL → utilisateur via la clé anon (JWT) : restreint.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- C-01 : handle_new_user() ne doit JAMAIS faire confiance au rôle envoyé par
-- le client (raw_user_meta_data). Le rôle est forcé à 'USER' ; INSURER et
-- ADMIN ne sont attribuables que par un admin via la service_role.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    'USER', -- forcé : jamais de confiance dans raw_user_meta_data->>'role'
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- C-02 : empêcher un utilisateur de s'auto-attribuer le rôle ADMIN, de
-- réactiver son compte ou de changer son email (la policy UPDATE de profiles
-- est colonne-agnostique). Seul un admin (ou la service_role) peut le faire.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
begin
  -- service_role (uid IS NULL) : contexte serveur de confiance (routes admin).
  if uid is null then
    return new;
  end if;
  -- Utilisateur authentifié non-admin (via anon key) : champs sensibles verrouillés.
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_sensitive_fields on public.profiles;
create trigger profiles_protect_sensitive_fields
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_fields();

-- ════════════════════════════════════════════════════════════════════════════
-- C-03 : retirer la policy d'auto-liaison insurer_accounts ("self-link") qui
-- permettait à n'importe quel utilisateur de se lier à n'importe quel
-- assureur (puis de lire/modifier ses devis et contrats). L'admin seul crée
-- désormais les liaisons.
-- ════════════════════════════════════════════════════════════════════════════
drop policy if exists "Insurers can link their own profile"
  on public.insurer_accounts;

-- ════════════════════════════════════════════════════════════════════════════
-- H-04 : empêcher un CLIENT de falsifier le cycle de vie et les prix de ses
-- devis (status APPROVED, final_price = 0...). L'insurer et l'admin restent
-- libres ; la service_role (uid NULL) passe.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.protect_quote_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  is_insurer boolean;
begin
  -- service_role : contexte serveur de confiance.
  if uid is null then
    return new;
  end if;

  select exists (
    select 1 from public.insurer_accounts where profile_id = uid
  ) into is_insurer;

  if public.is_admin() or is_insurer then
    return new;
  end if;

  -- Client authentifié via anon key : pas de maîtrise du cycle de vie / prix.
  if TG_OP = 'INSERT' then
    new.status := 'DRAFT';
    new.final_price := null;
    new.estimated_price := null;
  else -- UPDATE
    new.status := old.status;
    new.final_price := old.final_price;
    new.estimated_price := old.estimated_price;
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_protect_lifecycle on public.quotes;
create trigger quotes_protect_lifecycle
  before insert or update on public.quotes
  for each row execute function public.protect_quote_lifecycle();

-- ════════════════════════════════════════════════════════════════════════════
-- H-05 : intégrité financière — interdire les montants négatifs.
-- NOT VALID : ne valide pas les lignes existantes (évite un échec de migration
-- sur données historiques), mais s'applique à tous les INSERT/UPDATE futurs.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.quotes
  add constraint quotes_estimated_price_pos check (estimated_price is null or estimated_price >= 0) not valid;
alter table public.quotes
  add constraint quotes_final_price_pos check (final_price is null or final_price >= 0) not valid;
alter table public.quote_coverages
  add constraint quote_coverages_premium_pos check (premium_amount >= 0) not valid;

-- ════════════════════════════════════════════════════════════════════════════
-- B-10 : révoquer l'exécution directe (publique) des fonctions SECURITY
-- DEFINER. Elles restent utilisées par leurs triggers propriétaires.
-- ════════════════════════════════════════════════════════════════════════════
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
