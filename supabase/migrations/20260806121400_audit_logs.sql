-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table audit_logs (journaux d'audit) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Journal sensible, en écriture seule côté app ; accès admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  user_email text,
  user_name text,
  action text not null, -- LOGIN | LOGOUT | CREATE | UPDATE | DELETE | EXPORT | SETTINGS_CHANGE | ...
  entity text not null, -- Profile | Insurer | Offer | Quote | Settings | Backup | Role | ...
  entity_id text,
  details text not null default '{}', -- JSON
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Journal d''audit des actions sensibles effectuées sur la plateforme.';

alter table public.audit_logs enable row level security;

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_user_id_idx on public.audit_logs (user_id);

-- RLS : lecture réservée aux admins
create policy "Admins can view audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

-- RLS : création réservée aux admins
create policy "Admins can create audit logs"
on public.audit_logs
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update audit logs"
on public.audit_logs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete audit logs"
on public.audit_logs
for delete
to authenticated
using (public.is_admin());
