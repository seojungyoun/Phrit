create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text default '',
  created_at timestamptz default now()
);

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

alter table profiles enable row level security;
alter table daily_questions enable row level security;
alter table posts enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table saved_posts enable row level security;
