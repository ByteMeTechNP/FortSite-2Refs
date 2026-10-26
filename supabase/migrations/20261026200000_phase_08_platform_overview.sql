-- Phase 08: narrow Platform Owner company overview RPC.
-- No seed data. No companies policy change. No Phase 09–11 schema.
-- Apply only after explicit approval via MCP apply_migration on
-- project rvfoveqprrtobmywaodf.

create or replace function public.platform_company_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pending_setup integer := 0;
  active_count integer := 0;
  suspended_count integer := 0;
  archived_count integer := 0;
  total_count integer := 0;
  company_rows jsonb := '[]'::jsonb;
begin
  if not public.is_platform_owner() then
    raise exception 'permission denied: platform owner required'
      using errcode = '42501';
  end if;

  select
    count(*) filter (where c.lifecycle_status = 'pending_setup'),
    count(*) filter (where c.lifecycle_status = 'active'),
    count(*) filter (where c.lifecycle_status = 'suspended'),
    count(*) filter (where c.lifecycle_status = 'archived'),
    count(*)
  into
    pending_setup,
    active_count,
    suspended_count,
    archived_count,
    total_count
  from public.companies c;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'company_code', c.company_code,
        'legal_name', c.legal_name,
        'display_name', c.display_name,
        'registration_country', c.registration_country,
        'lifecycle_status', c.lifecycle_status,
        'created_at', c.created_at
      )
      order by c.created_at desc, c.company_code asc
    ),
    '[]'::jsonb
  )
  into company_rows
  from public.companies c;

  return jsonb_build_object(
    'counts',
    jsonb_build_object(
      'pending_setup', pending_setup,
      'active', active_count,
      'suspended', suspended_count,
      'archived', archived_count,
      'total', total_count
    ),
    'companies',
    company_rows
  );
end;
$$;

comment on function public.platform_company_overview() is
  'SECURITY DEFINER aggregate for Platform Owners only. Returns company counts and safe metadata. Does not bypass ordinary company RLS for direct table reads.';

revoke all on function public.platform_company_overview() from public;
revoke all on function public.platform_company_overview() from anon;
grant execute on function public.platform_company_overview() to authenticated;
