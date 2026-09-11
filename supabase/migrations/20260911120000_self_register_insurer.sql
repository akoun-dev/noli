-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Auto-inscription assureur.
--
-- Le trigger handle_new_user() accepte désormais le rôle depuis
-- raw_user_meta_data (USER ou INSURER uniquement). ADMIN est interdit
-- côté trigger (jamais d'élévation de privilèges à l'inscription).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  -- N'accepter que USER ou INSURER ; tout le reste → USER
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'USER');
  if requested_role not in ('USER', 'INSURER') then
    requested_role := 'USER';
  end if;

  begin
    insert into public.profiles (id, email, role, first_name, last_name, phone)
    values (
      new.id,
      new.email,
      requested_role,
      new.raw_user_meta_data ->> 'firstName',
      new.raw_user_meta_data ->> 'lastName',
      new.raw_user_meta_data ->> 'phone'
    )
    on conflict (id) do nothing;
  exception
    when others then
      raise warning '[handle_new_user] création de profil ignorée pour %: %',
        new.id, sqlerrm;
  end;
  return new;
end;
$$;
