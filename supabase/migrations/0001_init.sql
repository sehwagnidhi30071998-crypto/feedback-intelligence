-- Feedback Intelligence — MVP database structure
-- Apply in: Supabase Dashboard → SQL Editor → New query → paste → Run

-- 1. MEETINGS — one row per meeting
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  participants text,
  context text,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TRANSCRIPTS — the pasted meeting transcript text
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 3. FEEDBACK — extracted feedback items
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  transcript_id uuid references public.transcripts(id) on delete set null,
  title text not null,
  type text,
  reporter text,
  reporter_team text,
  reported_date date,
  problem text,
  requested_change text,
  proposed_implementation text,
  domain_knowledge text,
  transcript_evidence text,
  confidence numeric,
  impact numeric,
  ease numeric,
  ice_score numeric,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. JIRA_TICKETS — Jira tickets created from approved feedback
create table if not exists public.jira_tickets (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null unique references public.feedback(id) on delete cascade,
  ticket_key text not null,
  ticket_url text,
  status text,
  sprint text,
  assignee text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Speed up common lookups
create index if not exists idx_transcripts_meeting_id on public.transcripts (meeting_id);
create index if not exists idx_feedback_meeting_id on public.feedback (meeting_id);
create index if not exists idx_feedback_review_status on public.feedback (review_status);
create index if not exists idx_jira_tickets_feedback_id on public.jira_tickets (feedback_id);

-- Security is OFF for the MVP (no login yet). We will switch it on when we add accounts.
alter table public.meetings disable row level security;
alter table public.transcripts disable row level security;
alter table public.feedback disable row level security;
alter table public.jira_tickets disable row level security;