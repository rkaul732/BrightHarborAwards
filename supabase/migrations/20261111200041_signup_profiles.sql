alter table public.staff add column if not exists programs text[] not null default '{}';
update public.staff set programs = array[program] where cardinality(programs) = 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'staff_has_program' and conrelid = 'public.staff'::regclass) then
    alter table public.staff add constraint staff_has_program check (cardinality(programs) > 0);
  end if;
end $$;

create table if not exists public.signup_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  employee_type text not null check (employee_type in ('Employee', 'Coordinator', 'Director/Admin')),
  programs text[] not null check (cardinality(programs) > 0),
  created_at timestamptz not null default now()
);

alter table public.signup_requests enable row level security;
revoke all on public.signup_requests from anon, authenticated;
