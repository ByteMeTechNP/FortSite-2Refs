-- Phase 05: self-service user profiles only.
-- Linked one-to-one to auth.users. No company, role, or platform fields.
-- NOT APPLIED in the Phase 05 implementation turn. Apply only after explicit
-- human approval via the connected Supabase MCP apply_migration tool.

create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is
  'Self-service display profile for an Auth user. Not membership or authorization.';

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from authenticated;

grant select, insert, update on table public.user_profiles to authenticated;

create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
