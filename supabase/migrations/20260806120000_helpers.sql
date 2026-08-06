-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Fonctions utilitaires partagées.
-- ─────────────────────────────────────────────────────────────────────────────
-- Objectif : fonctions réutilisées par les tables et les politiques RLS.
-- Contenu  : set_updated_at(), handle_new_user(), is_admin().
-- Remarque : le trigger on_auth_user_created (qui appelle handle_new_user) est
-- créé dans le fichier de la table profiles, une fois celle-ci existante.
-- ─────────────────────────────────────────────────────────────────────────────

-- Met à jour updated_at à chaque UPDATE d'une ligne.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Crée le profil public dès la création d'un utilisateur Supabase Auth.
-- Les infos firstName/lastName/phone/role sont lues dans raw_user_meta_data
-- (renseignées au moment du signUp côté client).
-- NB : les clés du metadata sont en camelCase (envoyées par /api/auth), d'où
-- 'firstName' / 'lastName' ci-dessous.
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
    coalesce(new.raw_user_meta_data ->> 'role', 'USER'),
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- NB : public.is_admin() est défini dans le fichier de la table profiles,
-- car elle est en language sql (validée immédiatement) et dépend de cette table.
