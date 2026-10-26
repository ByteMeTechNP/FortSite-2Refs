-- MANUAL CONTROLLED OPERATION — NEVER AUTO-RUN.
-- Phase 07 Platform Owner recovery template.
-- Requires project-operator approval and a written reason.
-- Replace every __PLACEHOLDER__ before execution. Do not commit filled values.

do $$
declare
  target_user_id text := '__TARGET_USER_ID__';
  reason_code text := '__REASON_CODE__';
  previous_user_id text := '__PREVIOUS_USER_ID_OR_NULL__';
  target uuid;
  previous uuid;
begin
  if target_user_id like '%__%'
     or reason_code like '%__%'
     or previous_user_id like '%__%' then
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
    raise exception 'recovery_target_unavailable'
      using errcode = 'P0001';
  end if;

  perform set_config('fortsite.platform_owner_recovery', 'on', true);

  if previous_user_id is not null
     and previous_user_id <> ''
     and lower(previous_user_id) <> 'null' then
    previous := previous_user_id::uuid;
    update public.platform_admins
    set status = 'revoked'
    where user_id = previous
      and status = 'active';
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
    'controlled recovery'
  )
  on conflict (user_id) do update
  set
    platform_role = excluded.platform_role,
    status = 'active',
    granted_at = now(),
    revoked_at = null,
    notes = excluded.notes,
    updated_at = now();

  insert into public.platform_authority_audit_events (
    event_type,
    actor_user_id,
    target_user_id,
    outcome,
    reason_code,
    metadata
  )
  values (
    'bootstrap_recovery_used',
    null,
    target,
    'succeeded',
    reason_code,
    jsonb_build_object(
      'source', 'recover-platform-owner.template.sql',
      'previous_user_id', nullif(previous_user_id, 'null')
    )
  );
end;
$$;
