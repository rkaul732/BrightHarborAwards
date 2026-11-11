alter table public.store_products
  add column source_product_id text unique,
  add column option_price_adjustments jsonb not null default '{}'::jsonb
    check (jsonb_typeof(option_price_adjustments) = 'object'),
  add column personalization_fields jsonb not null default '[]'::jsonb
    check (jsonb_typeof(personalization_fields) = 'array');

create or replace function public.redeem_store_item(
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
  total_cents integer;
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

  if exists (
    select 1 from jsonb_each(product.options) as option(key, value)
    where jsonb_typeof(option.value) <> 'array'
       or jsonb_typeof(p_selected_options -> option.key) <> 'string'
       or not (option.value ? (p_selected_options ->> option.key))
  ) or exists (
    select 1 from jsonb_object_keys(p_selected_options) as selected(key)
    where not (product.options ? selected.key)
      and not exists (
        select 1 from jsonb_array_elements(product.personalization_fields) as field(value)
        where field.value ->> 'label' = selected.key
      )
  ) or exists (
    select 1 from jsonb_array_elements(product.personalization_fields) as field(value)
    where p_selected_options ? (field.value ->> 'label')
      and (
        jsonb_typeof(p_selected_options -> (field.value ->> 'label')) <> 'string'
        or char_length(btrim(p_selected_options ->> (field.value ->> 'label'))) >
           (field.value ->> 'max_length')::integer
      )
  ) then
    raise exception 'Select valid product options';
  end if;

  total_cents := product.price_cents;
  select total_cents + coalesce(sum(coalesce(
    (product.option_price_adjustments -> option.key ->> (p_selected_options ->> option.key))::integer, 0
  )), 0) into total_cents
  from jsonb_each(product.options) as option(key, value);
  select total_cents + coalesce(sum((field.value ->> 'price_cents')::integer), 0)
    into total_cents
  from jsonb_array_elements(product.personalization_fields) as field(value)
  where nullif(btrim(p_selected_options ->> (field.value ->> 'label')), '') is not null;

  perform 1 from public.staff where id = p_staff_id for update;
  if not found then raise exception 'Staff member not found'; end if;
  required_points := (total_cents + 9) / 10;
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
    (p_staff_id, product.id, product.name, p_selected_options, total_cents, required_points)
  returning id into order_id;
  return order_id;
end;
$$;
