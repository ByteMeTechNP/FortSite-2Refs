-- MANUAL CONTROLLED OPERATION — NEVER AUTO-RUN.
-- Phase 07 first Platform Owner bootstrap template.
-- Replace every __PLACEHOLDER__ before execution in a trusted Cloud SQL
-- session owned by the project operator. Do not commit filled values.
-- Do not add this file to supabase/migrations/.

do $$
declare
  target_user_id text := '__TARGET_USER_ID__';
  reason_code text := '__REASON_CODE__';
  target uuid;
  active_count integer;
begin
  if target_user_id like '%__%' or reason_code like '%__%' then
    raise exception 'placeholder_unresolved'
      using errcode = 'P0001';
  end if;

  target := target_user_id::uuid;

  if not exists (
    select 1
    from auth.users u
    where u.id = target
      and u.email_confirmed_at is not null
  ) then
    raise exception 'bootstrap_target_unavailable'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into active_count
  from public.platform_admins pa
  where pa.status = 'active';

  if active_count > 0 then
    raise exception 'active_platform_owner_already_exists'
      using errcode = 'P0001';
  end if;

  insert into public.platform_admins (
    user_id,
    platform_role,
    status,
    granted_by_user_id,
    notes
  )
  values (
    target,
    'owner',
    'active',
    null,
    'initial controlled bootstrap'
  );

  insert into public.platform_authority_audit_events (
    event_type,
    actor_user_id,
    target_user_id,
    outcome,
    reason_code,
    metadata
  )
  values (
    'initial_owner_bootstrapped',
    null,
    target,
    'succeeded',
    reason_code,
    jsonb_build_object('source', 'bootstrap-platform-owner.template.sql')
  );
end;
$$;
