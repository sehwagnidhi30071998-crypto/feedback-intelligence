-- Feedback Intelligence - Fix Jira token encryption (correct + robust version)
--
-- Root cause: pgcrypto has NO function called pgsym_encrypt/pgsym_decrypt.
-- The correct functions are pgp_sym_encrypt / pgp_sym_decrypt. The original
-- migration used the wrong name, so saving a connection always failed with
-- "function pgsym_encrypt(text, text) does not exist".
--
-- This script:
--   1. ensures pgcrypto is available,
--   2. recreates save_jira_connection / decrypt_jira_token using the correct
--      pgp_sym_* functions, resolved dynamically so the schema does not matter
--      (public, extensions, etc.).
--
-- Apply in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Run in the SAME project the app uses (NEXT_PUBLIC_SUPABASE_URL ref:
-- bompizbtetlsrmkcbnyw), not an old/dev project.

-- 1) Make sure pgcrypto is available. Errors are swallowed so the rest of the
--    script always runs.
do $$
begin
  begin
    execute 'create extension if not exists pgcrypto';
  exception when others then
    raise notice 'Could not auto-enable pgcrypto: %', sqlerrm;
  end;
end $$;

-- 2) Recreate save_jira_connection using pgp_sym_encrypt
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
set search_path = public, extensions, pg_catalog
as $$
declare
  v_id uuid;
  v_owner uuid;
  v_enc_schema text;
begin
  select n.nspname
    into v_enc_schema
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where p.proname = 'pgp_sym_encrypt'
   order by n.nspname = 'public' desc, n.nspname = 'extensions' desc
   limit 1;

  if v_enc_schema is null then
    raise exception 'pgcrypto extension is not installed (db=%, has pgp_sym_encrypt=%)', current_database(), exists(select 1 from pg_proc where proname = 'pgp_sym_encrypt');
  end if;

  if p_id is null then
    if p_site_url is null or p_email is null or p_project_key is null or p_token is null then
      raise exception 'missing required fields';
    end if;
    execute format(
      'insert into public.jira_connections (user_id, name, site_url, email, project_key, issue_type, token_enc)
       values ($1, $2, $3, $4, $5, $6, %I.pgp_sym_encrypt($7, $8)) returning id',
      v_enc_schema
    ) into v_id
    using auth.uid(), p_name, p_site_url, p_email, p_project_key, p_issue_type, p_token, p_key;
    return v_id;
  else
    select user_id into v_owner from public.jira_connections where id = p_id;
    if v_owner is distinct from auth.uid() then
      raise exception 'not allowed';
    end if;
    execute format(
      'update public.jira_connections set
         name = coalesce($2, name),
         site_url = coalesce($3, site_url),
         email = coalesce($4, email),
         project_key = coalesce($5, project_key),
         issue_type = coalesce($6, issue_type),
         token_enc = case when $7 is not null then %I.pgp_sym_encrypt($7, $8) else token_enc end,
         updated_at = now()
       where id = $1',
      v_enc_schema
    )
    using p_id, p_name, p_site_url, p_email, p_project_key, p_issue_type, p_token, p_key;
    return p_id;
  end if;
end;
$$;

-- 3) Recreate decrypt_jira_token using pgp_sym_decrypt (returns text directly)
create or replace function public.decrypt_jira_token(p_id uuid, p_key text)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_enc bytea;
  v_owner uuid;
  v_dec_schema text;
  v_result text;
begin
  select n.nspname
    into v_dec_schema
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where p.proname = 'pgp_sym_decrypt'
   order by n.nspname = 'public' desc, n.nspname = 'extensions' desc
   limit 1;

  if v_dec_schema is null then
    raise exception 'pgcrypto extension is not installed (db=%, has pgp_sym_decrypt=%)', current_database(), exists(select 1 from pg_proc where proname = 'pgp_sym_decrypt');
  end if;

  select user_id, token_enc into v_owner, v_enc from public.jira_connections where id = p_id;
  if v_enc is null then
    return null;
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;

  execute format('select %I.pgp_sym_decrypt($1, $2)', v_dec_schema)
    into v_result
    using v_enc, p_key;
  return v_result;
end;
$$;

-- 4) Only signed-in users may call these functions
revoke all on function public.save_jira_connection(text, text, text, text, text, text, text, uuid) from public;
revoke all on function public.decrypt_jira_token(uuid, text) from public;
grant execute on function public.save_jira_connection(text, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.decrypt_jira_token(uuid, text) to authenticated;

-- 5) Verification - run in the SAME project as NEXT_PUBLIC_SUPABASE_URL
--    (ref: bompizbtetlsrmkcbnyw). Everything below should return counts >= 1.
select current_database() as db_name;
select count(*) as pgcrypto_installed from pg_extension where extname = 'pgcrypto';
select count(*) as pgp_sym_encrypt_count from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'pgp_sym_encrypt';
select count(*) as save_fn_count from pg_proc where proname = 'save_jira_connection' and pronamespace = 'public'::regnamespace;