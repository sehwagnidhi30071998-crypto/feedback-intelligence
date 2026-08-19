-- Feedback Intelligence - per-user AI provider keys (Bring Your Own Key)
--
-- Users can save their own provider API key (Groq / OpenAI / OpenRouter).
-- The app tries its shared GROQ_API_KEY first, and falls back to the user's
-- own key when the shared quota is exhausted. Keys are encrypted at rest with
-- the same server-side master key used for Jira tokens (JIRA_TOKEN_KEY).
--
-- Apply in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Run in the SAME project the app uses (NEXT_PUBLIC_SUPABASE_URL ref:
-- bompizbtetlsrmkcbnyw), not an old/dev project.

-- 1) Make sure pgcrypto is available.
create extension if not exists pgcrypto;

-- 2) One optional AI key per user.
create table if not exists public.ai_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('groq', 'openai', 'openrouter')),
  model text not null,
  base_url text,
  api_key_enc bytea not null,
  key_tail text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_ai_keys_user_id on public.ai_keys (user_id);

alter table public.ai_keys enable row level security;

-- Each user can only see and manage their own key.
create policy "ai_keys select owner" on public.ai_keys for select to authenticated using (auth.uid() = user_id);
create policy "ai_keys insert owner" on public.ai_keys for insert to authenticated with check (auth.uid() = user_id);
create policy "ai_keys update owner" on public.ai_keys for update to authenticated using (auth.uid() = user_id);
create policy "ai_keys delete owner" on public.ai_keys for delete to authenticated using (auth.uid() = user_id);

-- 3) Save/update the user's AI key with an encrypted secret.
--    p_key is the server-side master key (JIRA_TOKEN_KEY), passed by the app only.
create or replace function public.save_ai_key(
  p_key text,
  p_provider text,
  p_model text,
  p_base_url text default null,
  p_api_key text default null,
  p_key_tail text default null,
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
    raise exception 'pgcrypto extension is not installed';
  end if;

  -- Enforce one key per user: if no id was given but a row already exists,
  -- treat this save as an update of that row.
  if p_id is null then
    select id into v_id from public.ai_keys where user_id = auth.uid();
    if v_id is not null then
      p_id := v_id;
    end if;
  end if;

  if p_id is null then
    if p_api_key is null then
      raise exception 'missing api key';
    end if;
    execute format(
      'insert into public.ai_keys (user_id, provider, model, base_url, api_key_enc, key_tail)
       values ($1, $2, $3, $4, %I.pgp_sym_encrypt($5, $6), $7) returning id',
      v_enc_schema
    ) into v_id
    using auth.uid(), p_provider, p_model, p_base_url, p_api_key, p_key, p_key_tail;
    return v_id;
  else
    select user_id into v_owner from public.ai_keys where id = p_id;
    if v_owner is distinct from auth.uid() then
      raise exception 'not allowed';
    end if;
    execute format(
      'update public.ai_keys set
         provider = coalesce($2, provider),
         model = coalesce($3, model),
         base_url = $4,
         api_key_enc = case when $5 is not null then %I.pgp_sym_encrypt($5, $6) else api_key_enc end,
         key_tail = case when $5 is not null then $7 else key_tail end,
         updated_at = now()
       where id = $1',
      v_enc_schema
    )
    using p_id, p_provider, p_model, p_base_url, p_api_key, p_key, p_key_tail;
    return p_id;
  end if;
end;
$$;

-- 4) Decrypt a key only for its owner. Called by the server when making AI calls.
create or replace function public.decrypt_ai_key(p_id uuid, p_key text)
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
    raise exception 'pgcrypto extension is not installed';
  end if;

  select user_id, api_key_enc into v_owner, v_enc from public.ai_keys where id = p_id;
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

-- 5) Only signed-in users may call these functions.
revoke all on function public.save_ai_key(text, text, text, text, text, text, uuid) from public;
revoke all on function public.decrypt_ai_key(uuid, text) from public;
grant execute on function public.save_ai_key(text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.decrypt_ai_key(uuid, text) to authenticated;

-- 6) Verification - run in the SAME project as NEXT_PUBLIC_SUPABASE_URL
select current_database() as db_name;
select count(*) as ai_keys_table from pg_tables where schemaname = 'public' and tablename = 'ai_keys';
select count(*) as save_ai_key_fn from pg_proc where proname = 'save_ai_key' and pronamespace = 'public'::regnamespace;
select count(*) as decrypt_ai_key_fn from pg_proc where proname = 'decrypt_ai_key' and pronamespace = 'public'::regnamespace;