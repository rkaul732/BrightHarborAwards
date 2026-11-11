alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check
  check (role in ('employee', 'supervisor', 'director', 'admin', 'super_admin'));

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'staff_super_admin_email_check' and conrelid = 'public.staff'::regclass) then
    alter table public.staff add constraint staff_super_admin_email_check
      check (role <> 'super_admin' or lower(email) = 'rkaul@brightharbor.org');
  end if;
end $$;

update public.staff set role = 'super_admin'
where lower(email) = 'rkaul@brightharbor.org' and role <> 'super_admin';
