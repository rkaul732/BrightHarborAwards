create extension if not exists pgcrypto;

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  program text not null,
  role text not null check (role in ('employee', 'supervisor', 'director', 'admin')),
  created_at timestamptz not null default now()
);

create table public.shoutouts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.staff(id),
  recipient_id uuid not null references public.staff(id),
  message text not null check (char_length(message) between 1 and 1200),
  points integer not null check (points between 0 and 4),
  created_at timestamptz not null default now(),
  constraint no_self_recognition check (author_id <> recipient_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  shoutout_id uuid not null references public.shoutouts(id) on delete cascade,
  author_id uuid not null references public.staff(id),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.staff(id),
  shoutout_id uuid references public.shoutouts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint one_like_target check ((shoutout_id is not null) <> (comment_id is not null)),
  unique (author_id, shoutout_id),
  unique (author_id, comment_id)
);

create index shoutouts_recent_idx on public.shoutouts(created_at desc);
create index comments_shoutout_idx on public.comments(shoutout_id, created_at);

alter table public.staff enable row level security;
alter table public.shoutouts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- The Next.js API verifies each Supabase user, checks directory membership,
-- and uses the server-only service role. Direct client access stays disabled.
revoke all on public.staff, public.shoutouts, public.comments, public.likes from anon, authenticated;
