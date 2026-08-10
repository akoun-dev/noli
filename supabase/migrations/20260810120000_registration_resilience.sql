-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Résilience de l'inscription (QA 2026-08-10).
--
-- Symptôme observé en recette : l'inscription d'un nouveau client échoue avec
-- une erreur générique (« Database error saving new user »). Cause classique :
-- une exception dans le trigger on_auth_user_created / handle_new_user() fait
-- échouer TOUT l'INSERT sur auth.users, donc l'inscription entière.
--
-- Correctif : rendre handle_new_user() tolérant aux erreurs. La création du
-- profil est de toute façon garantie côté application (upsert via service_role
-- juste après signUp, cf. src/lib/auth-actions.ts). Le trigger reste un
-- « best-effort » : il ne doit JAMAIS bloquer la création du compte Auth.
--
-- Forward-only, idempotent (CREATE OR REPLACE). Le rôle reste forcé à 'USER'
-- (correctif de sécurité C-01 conservé).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email, role, first_name, last_name, phone)
    values (
      new.id,
      new.email,
      'USER', -- forcé : jamais de confiance dans raw_user_meta_data->>'role' (C-01)
      new.raw_user_meta_data ->> 'firstName',
      new.raw_user_meta_data ->> 'lastName',
      new.raw_user_meta_data ->> 'phone'
    )
    on conflict (id) do nothing;
  exception
    when others then
      -- N'interrompt jamais l'inscription : on trace et on laisse le filet
      -- applicatif (service_role) créer le profil.
      raise warning '[handle_new_user] création de profil ignorée pour %: %',
        new.id, sqlerrm;
  end;
  return new;
end;
$$;
