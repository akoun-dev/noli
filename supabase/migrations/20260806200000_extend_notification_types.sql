-- ─────────────────────────────────────────────────────────────────────────────
-- Noli — Étendre le CHECK de notifications à CALLBACK.
-- ─────────────────────────────────────────────────────────────────────────────
-- Les demandes de rappel (contact/request-callback) sont stockées dans
-- notifications avec le type "CALLBACK". Le CHECK initial ne l'autorisait pas,
-- ce qui faisait échouer les inserts au moment de la migration.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.notifications
  drop constraint notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CALLBACK'));
