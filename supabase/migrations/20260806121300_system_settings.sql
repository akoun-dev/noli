-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table system_settings (paramètres système) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Accès admin uniquement (peut contenir des secrets, ex : clés email).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.system_settings (
  id bigint generated always as identity primary key,
  key text not null unique,
  value text not null default '',
  category text not null default 'general', -- general | email | security | notification | appearance
  label text not null,
  type text not null default 'text', -- text | boolean | number | json | password
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is
  'Paramètres de configuration de la plateforme (email, sécurité, notifications, apparence).';

create trigger system_settings_set_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

alter table public.system_settings enable row level security;

-- RLS : lecture réservée aux admins
create policy "Admins can view system settings"
on public.system_settings
for select
to authenticated
using (public.is_admin());

-- RLS : création réservée aux admins
create policy "Admins can create system settings"
on public.system_settings
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update system settings"
on public.system_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete system settings"
on public.system_settings
for delete
to authenticated
using (public.is_admin());
