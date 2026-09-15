-- Auto-inscriptions assureur : l'etat d'attente doit etre impose par la base.
-- Le nom de compagnie est conserve pour permettre le rattachement manuel par
-- un administrateur lorsque la compagnie existe deja.

alter table public.profiles
  add column if not exists pending_company_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'USER');
  if requested_role not in ('USER', 'INSURER') then
    requested_role := 'USER';
  end if;

  insert into public.profiles (
    id, email, role, first_name, last_name, phone, is_active
  )
  values (
    new.id,
    new.email,
    requested_role,
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    new.raw_user_meta_data ->> 'phone',
    requested_role <> 'INSURER'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
