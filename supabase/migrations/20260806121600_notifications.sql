-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Table notifications + RLS.
-- ─────────────────────────────────────────────────────────────────────────────
-- Le destinataire gère ses notifications (lecture, marquage lu, suppression) ;
-- la création se fait côté serveur (Edge Function / service_role), policy
-- insert admin pour les accès directs client.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'INFO', -- INFO | SUCCESS | WARNING | ERROR
  title text not null,
  message text not null,
  link text, -- lien de navigation optionnel
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('INFO', 'SUCCESS', 'WARNING', 'ERROR'))
);

comment on table public.notifications is
  'Notifications utilisateur (informations sur devis, comptes, système).';

alter table public.notifications enable row level security;

create index notifications_user_id_is_read_idx on public.notifications (user_id, is_read);

-- RLS : lecture de ses propres notifications
create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

-- RLS : marquage "lu" de ses propres notifications
create policy "Users can mark their notifications as read"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- RLS : suppression de ses propres notifications
create policy "Users can delete their own notifications"
on public.notifications
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- RLS : création de notifications réservée aux admins (sinon serveur / service_role)
create policy "Admins can create notifications"
on public.notifications
for insert
to authenticated
with check (public.is_admin());
