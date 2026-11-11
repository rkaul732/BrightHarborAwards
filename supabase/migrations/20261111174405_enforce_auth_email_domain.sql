-- This protects Auth even if someone calls Supabase's signup API directly.
create function public.enforce_auth_email_domain()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.email is null or lower(btrim(new.email)) !~ '^[^@[:space:]]+@brightharbor\.org$' then
    raise exception 'Only @brightharbor.org email addresses can create an account.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_auth_email_domain() from public, anon, authenticated;

create trigger enforce_bright_harbor_auth_email
before insert or update of email on auth.users
for each row execute function public.enforce_auth_email_domain();
