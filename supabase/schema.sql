create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text default '',
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table profiles add column if not exists is_admin boolean default false;

create table if not exists daily_questions (
  id uuid primary key default uuid_generate_v4(),
  question_text text not null,
  question_date date unique not null,
  created_at timestamptz default now(),
  is_active boolean default true
);

create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references daily_questions(id) on delete cascade,
  image_url text not null,
  caption varchar(80) not null,
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

create table if not exists reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction_type text check (reaction_type in ('felt','echo','ripple')) not null,
  created_at timestamptz default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists saved_posts (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason text not null default 'unspecified',
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz default now(),
  unique(post_id, reporter_id)
);

create table if not exists blocked_users (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text unique not null,
  platform text default 'unknown',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table daily_questions enable row level security;
alter table posts enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table saved_posts enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;
alter table push_tokens enable row level security;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(nullif(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''), 'phriter') || '_' || substr(new.id::text, 1, 8),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "profiles are readable" on profiles;
create policy "profiles are readable" on profiles
  for select using (true);

drop policy if exists "users can insert own profile" on profiles;
create policy "users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "daily questions are readable" on daily_questions;
create policy "daily questions are readable" on daily_questions
  for select using (is_active = true);

drop policy if exists "admins can manage daily questions" on daily_questions;
create policy "admins can manage daily questions" on daily_questions
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "posts are readable" on posts;
create policy "posts are readable" on posts
  for select using (true);

drop policy if exists "users can create own posts" on posts;
create policy "users can create own posts" on posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can delete own posts" on posts;
create policy "users can delete own posts" on posts
  for delete using (auth.uid() = user_id);

drop policy if exists "reactions are readable" on reactions;
create policy "reactions are readable" on reactions
  for select using (true);

drop policy if exists "users can react as themselves" on reactions;
create policy "users can react as themselves" on reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can remove own reactions" on reactions;
create policy "users can remove own reactions" on reactions
  for delete using (auth.uid() = user_id);

drop policy if exists "comments are readable" on comments;
create policy "comments are readable" on comments
  for select using (true);

drop policy if exists "users can create own comments" on comments;
create policy "users can create own comments" on comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can delete own comments" on comments;
create policy "users can delete own comments" on comments
  for delete using (auth.uid() = user_id);

drop policy if exists "users can read own saves" on saved_posts;
create policy "users can read own saves" on saved_posts
  for select using (auth.uid() = user_id);

drop policy if exists "users can save posts" on saved_posts;
create policy "users can save posts" on saved_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can unsave posts" on saved_posts;
create policy "users can unsave posts" on saved_posts
  for delete using (auth.uid() = user_id);

drop policy if exists "users can create own reports" on reports;
create policy "users can create own reports" on reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "users can read own reports" on reports;
create policy "users can read own reports" on reports
  for select using (
    auth.uid() = reporter_id or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "admins can update reports" on reports;
create policy "admins can update reports" on reports
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  ) with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "users can read own blocks" on blocked_users;
create policy "users can read own blocks" on blocked_users
  for select using (auth.uid() = blocker_id);

drop policy if exists "users can create own blocks" on blocked_users;
create policy "users can create own blocks" on blocked_users
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "users can remove own blocks" on blocked_users;
create policy "users can remove own blocks" on blocked_users
  for delete using (auth.uid() = blocker_id);

drop policy if exists "users can read own push tokens" on push_tokens;
create policy "users can read own push tokens" on push_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "users can upsert own push tokens" on push_tokens;
create policy "users can upsert own push tokens" on push_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own push tokens" on push_tokens;
create policy "users can update own push tokens" on push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own push tokens" on push_tokens;
create policy "users can delete own push tokens" on push_tokens
  for delete using (auth.uid() = user_id);

drop policy if exists "post images are public" on storage.objects;
create policy "post images are public" on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists "users can upload own post images" on storage.objects;
create policy "users can upload own post images" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users can update own post images" on storage.objects;
create policy "users can update own post images" on storage.objects
  for update using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users can delete own post images" on storage.objects;
create policy "users can delete own post images" on storage.objects
  for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "profile images are public" on storage.objects;
create policy "profile images are public" on storage.objects
  for select using (bucket_id = 'profile-images');

drop policy if exists "users can upload own profile images" on storage.objects;
create policy "users can upload own profile images" on storage.objects
  for insert with check (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users can update own profile images" on storage.objects;
create policy "users can update own profile images" on storage.objects
  for update using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users can delete own profile images" on storage.objects;
create policy "users can delete own profile images" on storage.objects
  for delete using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);

insert into daily_questions (question_text, question_date)
values ('What felt most like today?', current_date)
on conflict (question_date) do nothing;
