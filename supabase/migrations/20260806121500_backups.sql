-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table backups (sauvegardes) + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Conservation pour compatibilité : les sauvegardes binaires SQLite deviennent
-- obsolètes ; Supabase fournit le point-in-time recovery (PITR) nativement.
-- Fichiers sensibles : accès admin uniquement.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.backups (
  id bigint generated always as identity primary key,
  filename text not null,
  file_size integer not null default 0,
  status text not null default 'COMPLETED', -- COMPLETED | FAILED | IN_PROGRESS | SCHEDULED
  type text not null default 'MANUAL', -- MANUAL | SCHEDULED | AUTO
  schedule text, -- expression cron
  next_run timestamptz,
  path text,
  note text,
  created_at timestamptz not null default now(),
  constraint backups_status_check check (status in ('COMPLETED', 'FAILED', 'IN_PROGRESS', 'SCHEDULED')),
  constraint backups_type_check check (type in ('MANUAL', 'SCHEDULED', 'AUTO'))
);

comment on table public.backups is
  'Historique des sauvegardes ; conservé pour traçabilité (Supabase gère le PITR).';

alter table public.backups enable row level security;

-- RLS : lecture réservée aux admins
create policy "Admins can view backups"
on public.backups
for select
to authenticated
using (public.is_admin());

-- RLS : création réservée aux admins
create policy "Admins can create backups"
on public.backups
for insert
to authenticated
with check (public.is_admin());

-- RLS : modification réservée aux admins
create policy "Admins can update backups"
on public.backups
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS : suppression réservée aux admins
create policy "Admins can delete backups"
on public.backups
for delete
to authenticated
using (public.is_admin());
