-- Feedback Intelligence - Auth, RLS, and per-user Jira connections
-- Apply in the PRODUCTION Supabase project: SQL Editor -> New query -> paste -> Run

-- 1. pgcrypto is used to encrypt each user's Jira API token at rest
create extension if not exists pgcrypto;

-- 2. Track who added each meeting (the data owner)
alter table public.meetings
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;

-- 3. Per-user Jira connections (tokens stored encrypted)
create table if not exists public.jira_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Jira',
  site_url text not null,
  email text not null,
  token_enc bytea not null,
  project_key text not null,
  issue_type text not null default 'Task',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Link each created ticket to the connection that created it
alter table public.jira_tickets
  add column if not exists jira_connection_id uuid references public.jira_connections(id) on delete set null;

create index if not exists idx_jira_connections_user_id on public.jira_connections (user_id);

-- 5. Turn on Row Level Security everywhere
alter table public.meetings enable row level security;
alter table public.transcripts enable row level security;
alter table public.feedback enable row level security;
alter table public.jira_tickets enable row level security;
alter table public.jira_connections enable row level security;

-- 6. Shared workspace: any signed-in user can read/write app data (meetings, transcripts, feedback, tickets)
create policy "meetings select auth" on public.meetings for select to authenticated using (true);
create policy "meetings insert auth" on public.meetings for insert to authenticated with check (true);
create policy "meetings update auth" on public.meetings for update to authenticated using (true);
create policy "meetings delete auth" on public.meetings for delete to authenticated using (true);

create policy "transcripts select auth" on public.transcripts for select to authenticated using (true);
create policy "transcripts insert auth" on public.transcripts for insert to authenticated with check (true);
create policy "transcripts update auth" on public.transcripts for update to authenticated using (true);
create policy "transcripts delete auth" on public.transcripts for delete to authenticated using (true);

create policy "feedback select auth" on public.feedback for select to authenticated using (true);
create policy "feedback insert auth" on public.feedback for insert to authenticated with check (true);
create policy "feedback update auth" on public.feedback for update to authenticated using (true);
create policy "feedback delete auth" on public.feedback for delete to authenticated using (true);

create policy "jira_tickets select auth" on public.jira_tickets for select to authenticated using (true);
create policy "jira_tickets insert auth" on public.jira_tickets for insert to authenticated with check (true);
create policy "jira_tickets update auth" on public.jira_tickets for update to authenticated using (true);
create policy "jira_tickets delete auth" on public.jira_tickets for delete to authenticated using (true);

-- 7. Jira connections: each user can only see and manage their own
create policy "jira_connections select owner" on public.jira_connections for select to authenticated using (auth.uid() = user_id);
create policy "jira_connections insert owner" on public.jira_connections for insert to authenticated with check (auth.uid() = user_id);
create policy "jira_connections update owner" on public.jira_connections for update to authenticated using (auth.uid() = user_id);
create policy "jira_connections delete owner" on public.jira_connections for delete to authenticated using (auth.uid() = user_id);

-- 8. Save/update a connection with an encrypted token.
--    p_key is the server-side master key (JIRA_TOKEN_KEY), passed by the app only.
--    NOTE: pgcrypto's symmetric functions are pgp_sym_encrypt/pgp_sym_decrypt
--    (pgsym_encrypt does not exist). search_path must include extensions because
--    pgcrypto lives in the extensions schema on Supabase.
create or replace function public.save_jira_connection(
  p_key text,
  p_name text default 'My Jira',
  p_site_url text default null,
  p_email text default null,
  p_project_key text default null,
  p_issue_type text default 'Task',
  p_token text default null,
  p_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_owner uuid;
begin
  if p_id is null then
    if p_site_url is null or p_email is null or p_project_key is null or p_token is null then
      raise exception 'missing required fields';
    end if;
    insert into public.jira_connections (user_id, name, site_url, email, project_key, issue_type, token_enc)
    values (auth.uid(), p_name, p_site_url, p_email, p_project_key, p_issue_type, pgp_sym_encrypt(p_token, p_key))
    returning id into v_id;
    return v_id;
  else
    select user_id into v_owner from public.jira_connections where id = p_id;
    if v_owner is distinct from auth.uid() then
      raise exception 'not allowed';
    end if;
    update public.jira_connections set
      name = coalesce(p_name, name),
      site_url = coalesce(p_site_url, site_url),
      email = coalesce(p_email, email),
      project_key = coalesce(p_project_key, project_key),
      issue_type = coalesce(p_issue_type, issue_type),
      token_enc = case when p_token is not null then pgp_sym_encrypt(p_token, p_key) else token_enc end,
      updated_at = now()
    where id = p_id;
    return p_id;
  end if;
end;
$$;

-- 9. Decrypt a token only for its owner. Called by the server when creating a ticket.
create or replace function public.decrypt_jira_token(p_id uuid, p_key text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_enc bytea;
  v_owner uuid;
begin
  select user_id, token_enc into v_owner, v_enc from public.jira_connections where id = p_id;
  if v_enc is null then
    return null;
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;
  return pgp_sym_decrypt(v_enc, p_key);
end;
$$;

-- 10. Only signed-in users may call these functions (never the public anon key)
revoke all on function public.save_jira_connection(text, text, text, text, text, text, text, uuid) from public;
revoke all on function public.decrypt_jira_token(uuid, text) from public;
grant execute on function public.save_jira_connection(text, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.decrypt_jira_token(uuid, text) to authenticated;
