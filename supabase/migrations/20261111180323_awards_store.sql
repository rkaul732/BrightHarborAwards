create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents > 0),
  image_url text not null,
  source_url text not null,
  options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id),
  product_id uuid not null references public.store_products(id),
  product_name text not null,
  selected_options jsonb not null default '{}'::jsonb check (jsonb_typeof(selected_options) = 'object'),
  price_cents integer not null check (price_cents > 0),
  points_spent integer not null check (points_spent > 0),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_orders_staff_idx on public.store_orders(staff_id, created_at desc);
create index store_orders_status_idx on public.store_orders(status, created_at desc);

alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;
revoke all on public.store_products, public.store_orders from anon, authenticated;

-- The API authenticates staff before calling this function with its server-only key.
-- Locking the staff row serializes redemptions for one account and prevents overspending.
create function public.redeem_store_item(
  p_staff_id uuid,
  p_product_id uuid,
  p_selected_options jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  product public.store_products%rowtype;
  required_points integer;
  earned_points bigint;
  spent_points bigint;
  order_id uuid;
begin
  if p_selected_options is null or jsonb_typeof(p_selected_options) <> 'object' then
    raise exception 'Select valid product options';
  end if;

  select * into product from public.store_products
  where id = p_product_id and active = true;
  if not found then raise exception 'Product is unavailable'; end if;

  if (select count(*) from jsonb_object_keys(p_selected_options)) <>
     (select count(*) from jsonb_object_keys(product.options)) or
     exists (
       select 1 from jsonb_each(product.options) as option(key, value)
       where jsonb_typeof(option.value) <> 'array'
          or jsonb_typeof(p_selected_options -> option.key) <> 'string'
          or not (option.value ? (p_selected_options ->> option.key))
     ) then
    raise exception 'Select valid product options';
  end if;

  perform 1 from public.staff where id = p_staff_id for update;
  if not found then raise exception 'Staff member not found'; end if;

  required_points := (product.price_cents + 9) / 10;
  select coalesce(sum(points), 0) into earned_points
    from public.shoutouts where recipient_id = p_staff_id;
  select coalesce(sum(points_spent), 0) into spent_points
    from public.store_orders where staff_id = p_staff_id and status <> 'cancelled';
  if earned_points - spent_points < required_points then
    raise exception 'Not enough spendable points';
  end if;

  insert into public.store_orders
    (staff_id, product_id, product_name, selected_options, price_cents, points_spent)
  values
    (p_staff_id, product.id, product.name, p_selected_options, product.price_cents, required_points)
  returning id into order_id;

  return order_id;
end;
$$;

revoke all on function public.redeem_store_item(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.redeem_store_item(uuid, uuid, jsonb) to service_role;
