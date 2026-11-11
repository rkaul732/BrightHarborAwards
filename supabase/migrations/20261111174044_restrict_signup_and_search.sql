-- Supabase Auth calls this before creating any user, including direct API signups.
create function public.restrict_signup_to_brightharbor(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  address text := lower(btrim(event->'user'->>'email'));
begin
  if address is null or address !~ '^[^@[:space:]]+@brightharbor\.org$' then
    return jsonb_build_object('error', jsonb_build_object(
      'message', 'Only @brightharbor.org email addresses can create an account.',
      'http_code', 403
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

revoke execute on function public.restrict_signup_to_brightharbor(jsonb) from public, anon, authenticated;
grant execute on function public.restrict_signup_to_brightharbor(jsonb) to supabase_auth_admin;

-- Search the full recognition history by message or either person's name.
create function public.search_recognition(search_term text, result_limit integer default 51, result_offset integer default 0)
returns setof public.shoutouts
language sql
stable
security invoker
set search_path = ''
as $$
  select shoutout.*
  from public.shoutouts as shoutout
  join public.staff as author on author.id = shoutout.author_id
  join public.staff as recipient on recipient.id = shoutout.recipient_id
  where length(btrim(search_term)) > 0
    and (
      position(lower(btrim(search_term)) in lower(shoutout.message)) > 0
      or position(lower(btrim(search_term)) in lower(author.name)) > 0
      or position(lower(btrim(search_term)) in lower(recipient.name)) > 0
    )
  order by shoutout.created_at desc, shoutout.id desc
  limit least(greatest(result_limit, 1), 51)
  offset greatest(result_offset, 0);
$$;

revoke execute on function public.search_recognition(text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_recognition(text, integer, integer) to service_role;
