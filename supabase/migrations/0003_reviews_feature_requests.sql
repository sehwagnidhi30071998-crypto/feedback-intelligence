-- Reviews and feature requests — public read, authenticated write

-- 1. Reviews — star rating + comment shown publicly and inside the app
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(comment) > 0),
  author_name text check (author_name is null or char_length(author_name) <= 80),
  user_id uuid references auth.users(id) on delete set null
);

-- 2. Feature requests — simple description + problem it solves
create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  feature_description text not null check (char_length(feature_description) > 0),
  problem text not null check (char_length(problem) > 0),
  author_name text check (author_name is null or char_length(author_name) <= 80),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','considered','planned','done','rejected'))
);

create index if not exists idx_reviews_created_at on public.reviews (created_at desc);
create index if not exists idx_feature_requests_created_at on public.feature_requests (created_at desc);
create index if not exists idx_reviews_rating on public.reviews (rating);

alter table public.reviews enable row level security;
alter table public.feature_requests enable row level security;

-- Public can read (landing page + inside app)
create policy "reviews select public" on public.reviews
  for select to public using (true);

create policy "feature_requests select public" on public.feature_requests
  for select to public using (true);

-- Only signed-in users can create / manage
create policy "reviews insert auth" on public.reviews
  for insert to authenticated with check (true);

create policy "reviews update auth" on public.reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reviews delete auth" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);

create policy "feature_requests insert auth" on public.feature_requests
  for insert to authenticated with check (true);

create policy "feature_requests update auth" on public.feature_requests
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "feature_requests delete auth" on public.feature_requests
  for delete to authenticated using (auth.uid() = user_id);