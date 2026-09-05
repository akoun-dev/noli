-- Donnees de developpement locales. Ne pas utiliser ce fichier en production.
create extension if not exists pgcrypto;

insert into public.users (id, email, password_hash, email_verified_at)
values
  ('3401a5e9-5e7b-427c-9b31-912e02d72c6a', 'admin@noli.ci', crypt('Admin@2025', gen_salt('bf', 10)), now()),
  ('b5f51618-ffbd-40c0-b0ab-164f327672fa', 'user@test.ci', crypt('User@2025', gen_salt('bf', 10)), now()),
  ('68ce500f-1ed9-4504-bc5a-84041a1ce8a9', 'assureur@saham.ci', crypt('Assureur@2025', gen_salt('bf', 10)), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, role, first_name, last_name, is_active)
values
  ('3401a5e9-5e7b-427c-9b31-912e02d72c6a', 'admin@noli.ci', 'ADMIN', 'Admin', 'Noli', true),
  ('b5f51618-ffbd-40c0-b0ab-164f327672fa', 'user@test.ci', 'USER', 'Utilisateur', 'Test', true),
  ('68ce500f-1ed9-4504-bc5a-84041a1ce8a9', 'assureur@saham.ci', 'INSURER', 'Assureur', 'SAHAM', true)
on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

insert into public.insurers (code, name)
values ('SAHAM', 'SAHAM Assurance')
on conflict (code) do nothing;

insert into public.insurer_accounts (profile_id, insurer_id)
select '68ce500f-1ed9-4504-bc5a-84041a1ce8a9', id
from public.insurers
where code = 'SAHAM'
on conflict (profile_id, insurer_id) do nothing;
