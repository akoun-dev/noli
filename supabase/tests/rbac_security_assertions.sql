-- =============================================================================
-- RBAC security assertions — run AFTER the stub and the migration.
-- Asserts the behaviour of 20251121000000_security_harden_rbac.sql.
-- Any failed ASSERT aborts with a non-zero exit status.
-- =============================================================================

DO $$
DECLARE
  admin_id  uuid := '11111111-1111-1111-1111-111111111111';
  user_id   uuid := '22222222-2222-2222-2222-222222222222';
  ok boolean;
  n int;
BEGIN
  -- Seed as trusted backend (no end-user JWT => trigger allows role writes).
  PERFORM set_config('test.uid', '', false);
  DELETE FROM public.profiles;
  INSERT INTO public.profiles(id, email, role) VALUES
    (admin_id, 'admin@example.com', 'ADMIN'),
    (user_id,  'user@example.com',  'USER');

  -- 1. A normal user CANNOT self-promote to ADMIN via a direct UPDATE.
  PERFORM set_config('test.uid', user_id::text, false);
  ok := false;
  BEGIN
    UPDATE public.profiles SET role = 'ADMIN' WHERE id = user_id;
  EXCEPTION WHEN insufficient_privilege THEN
    ok := true;
  END;
  ASSERT ok, '1: role escalation via UPDATE was NOT blocked';

  PERFORM set_config('test.uid', '', false);
  SELECT (role = 'USER') INTO ok FROM public.profiles WHERE id = user_id;
  ASSERT ok, '1b: user role changed despite the block';

  -- 2. A normal user CAN edit their own non-privileged fields.
  PERFORM set_config('test.uid', user_id::text, false);
  UPDATE public.profiles SET first_name = 'Bob' WHERE id = user_id;
  PERFORM set_config('test.uid', '', false);
  SELECT (first_name = 'Bob') INTO ok FROM public.profiles WHERE id = user_id;
  ASSERT ok, '2: legitimate self-update was blocked';

  -- 3. A user CANNOT self-provision an ADMIN account via INSERT.
  PERFORM set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  ok := false;
  BEGIN
    INSERT INTO public.profiles(id, email, role)
      VALUES ('33333333-3333-3333-3333-333333333333', 'evil@example.com', 'ADMIN');
  EXCEPTION WHEN insufficient_privilege THEN
    ok := true;
  END;
  ASSERT ok, '3: ADMIN self-provisioning via INSERT was NOT blocked';

  -- 4. Self-registration as INSURER stays allowed (existing product flow).
  PERFORM set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  INSERT INTO public.profiles(id, email, role)
    VALUES ('44444444-4444-4444-4444-444444444444', 'ins@example.com', 'INSURER');
  PERFORM set_config('test.uid', '', false);
  SELECT count(*) INTO n FROM public.profiles WHERE email = 'ins@example.com';
  ASSERT n = 1, '4: legitimate INSURER self-registration was blocked';

  -- 5. A normal user CANNOT call an admin-only read RPC.
  PERFORM set_config('test.uid', user_id::text, false);
  ok := false;
  BEGIN
    PERFORM count(*) FROM public.get_users();
  EXCEPTION WHEN insufficient_privilege THEN
    ok := true;
  END;
  ASSERT ok, '5: get_users() was NOT gated for a non-admin';

  -- 6. An ADMIN CAN call the admin read RPC.
  PERFORM set_config('test.uid', admin_id::text, false);
  SELECT count(*) INTO n FROM public.get_users();
  ASSERT n >= 1, '6: get_users() failed for an admin';

  -- 7. An ADMIN CAN change another user''s role.
  PERFORM set_config('test.uid', admin_id::text, false);
  UPDATE public.profiles SET role = 'INSURER' WHERE id = user_id;
  PERFORM set_config('test.uid', '', false);
  SELECT (role = 'INSURER') INTO ok FROM public.profiles WHERE id = user_id;
  ASSERT ok, '7: admin could not update a user role';

  -- 8. The analytics view is now security_invoker.
  SELECT (c.reloptions @> ARRAY['security_invoker=true']
          OR c.reloptions @> ARRAY['security_invoker=on'])
    INTO ok
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'public' AND c.relname = 'user_stats_view';
  ASSERT ok, '8: user_stats_view is not security_invoker';

  RAISE NOTICE 'ALL RBAC SECURITY ASSERTIONS PASSED';
END $$;
