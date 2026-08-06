-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Seed : comptes de test
-- ─────────────────────────────────────────────────────────────────────────────
-- Crée les 3 comptes de test définis dans comptes-test.md :
--   Admin       admin@noli.ci        / Admin@2025
--   Utilisateur user@test.ci         / User@2025
--   Assureur    assureur@saham.ci    / Assureur@2025
--
-- Les utilisateurs sont créés directement dans auth.users avec un mot de passe
-- bcrypt (extension pgcrypto) et un email confirmé, puis le trigger
-- on_auth_user_created insère le profil public correspondant.
-- Le compte assureur est en plus lié à la compagnie SAHAM (insurer_accounts).
--
-- Exécution : supabase seed (local) / supabase seed --linked (projet lié).
-- Idempotent : on conflict (...) do nothing permet de relancer sans erreur.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
   email_change, phone_change, phone_change_token, reauthentication_token,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '3401a5e9-5e7b-427c-9b31-912e02d72c6a',
   'authenticated', 'authenticated', 'admin@noli.ci',
   extensions.crypt('Admin@2025', extensions.gen_salt('bf', 10)),
   now(), '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"role":"ADMIN","firstName":"Admin","lastName":"Noli"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b5f51618-ffbd-40c0-b0ab-164f327672fa',
   'authenticated', 'authenticated', 'user@test.ci',
   extensions.crypt('User@2025', extensions.gen_salt('bf', 10)),
   now(), '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"role":"USER","firstName":"Utilisateur","lastName":"Test"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68ce500f-1ed9-4504-bc5a-84041a1ce8a9',
   'authenticated', 'authenticated', 'assureur@saham.ci',
   extensions.crypt('Assureur@2025', extensions.gen_salt('bf', 10)),
   now(), '', '', '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"role":"INSURER","firstName":"Assureur","lastName":"SAHAM"}', now(), now())
on conflict (id) do nothing;

-- Profils publics (le trigger on_auth_user_created les crée déjà ; cet insert
-- sert de filet de sécurité si le trigger est désactivé).
insert into public.profiles (id, email, role, first_name, last_name, is_active)
select id, email,
  raw_user_meta_data ->> 'role',
  raw_user_meta_data ->> 'firstName',
  raw_user_meta_data ->> 'lastName',
  true
from auth.users
where email in ('admin@noli.ci', 'user@test.ci', 'assureur@saham.ci')
on conflict (id) do nothing;

-- Liaison du compte assureur avec la compagnie SAHAM.
insert into public.insurer_accounts (profile_id, insurer_id)
select p.id, i.id
from public.profiles p
join public.insurers i on i.code = 'SAHAM'
where p.email = 'assureur@saham.ci'
on conflict (profile_id, insurer_id) do nothing;
