-- Vendor catalog observed 2026-11-11 at the Bright Harbor Farros Tees store.
insert into public.store_products
  (source_product_id, name, description, price_cents, image_url, source_url,
   options, option_price_adjustments, personalization_fields, sort_order)
values
  (
    '1028319', 'Bright Harbor Breast Cancer Ribbon Cotton T-Shirt',
    'Gildan · 5.3-ounce, 100% cotton', 2300,
    'https://cdn.inksoft.com/images/products/6582/products/5000_BHHBC_DTF/Black/front/500.png?decache=638646822058930000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1028319',
    '{"Color":["Black"],"Size":["S","M","L","XL","2XL","3XL"]}',
    '{"Size":{"2XL":200,"3XL":300}}', '[]', 1
  ),
  (
    '1015003', 'Bright Harbor Healthcare Cotton T-Shirt',
    'Gildan · 5.3-ounce, 100% cotton', 2000,
    'https://cdn.inksoft.com/images/products/6582/products/5000_COPY71_SCREEN/White/front/500.png?decache=638255360813370000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015003',
    '{"Color":["White","Lt. Blue","Sport Grey"],"Size":["S","M","L","XL","2XL","3XL"]}',
    '{"Size":{"2XL":200,"3XL":300}}', '[]', 2
  ),
  (
    '1015004', 'Bright Harbor Healthcare Cotton Long Sleeve T-Shirt',
    'Gildan · 5.3-ounce, 100% cotton', 2500,
    'https://cdn.inksoft.com/images/products/6582/products/5400_COPY39_SCREEN/Carolina_Blue/front/500.png?decache=638255358009330000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015004',
    '{"Color":["Carolina Blue","Sport Gray","White"],"Size":["S","M","L","XL","2XL"]}',
    '{"Size":{"2XL":200}}', '[]', 3
  ),
  (
    '1015007', 'Bright Harbor Healthcare Pullover Hooded Sweatshirt',
    'Gildan · 50/50 blend hooded sweatshirt', 4000,
    'https://cdn.inksoft.com/images/products/6582/products/G185_BRH_SCREEN/Carolina_Blue/front/500.png?decache=638255371223770000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015007',
    '{"Color":["Carolina Blue","Sports Grey","White"],"Size":["S","M","L","XL","2XL","3XL"]}',
    '{"Size":{"2XL":300,"3XL":400}}', '[]', 4
  ),
  (
    '1015005', 'Bright Harbor Healthcare Full-Zip Hooded Sweatshirt',
    'Gildan · 8-ounce 50/50 blend with pouch pockets', 5000,
    'https://cdn.inksoft.com/images/products/6582/products/18600_BRH_SCREEN/Carolina_Blue/front/500.png?decache=638255370417130000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015005',
    '{"Color":["Carolina Blue","Sport Grey","White"],"Size":["Adult S","Adult M","Adult L","Adult XL","Adult 2XL","Adult 3XL","Adult 4XL"]}',
    '{"Size":{"Adult 2XL":300,"Adult 3XL":400,"Adult 4XL":600}}',
    '[{"label":"Name on Right Chest","price_cents":1500,"max_length":40},{"label":"Title Under Name","price_cents":500,"max_length":40}]', 5
  ),
  (
    '1015008', 'Bright Harbor Healthcare Ladies'' Jersey Racerback Tank',
    'Bella + Canvas jersey racerback tank', 2500,
    'https://cdn.inksoft.com/images/products/6582/products/B6008_BRH_SCREEN/WHITE/front/500.png?decache=638255372777500000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015008',
    '{"Color":["WHITE","ATHLETIC HEATHER"],"Size":["S","M","L","XL","2XL"]}',
    '{"Size":{"2XL":200}}', '[]', 6
  ),
  (
    '1015009', 'Bright Harbor Healthcare Performance Unisex Pique Polo',
    'CORE365 · Moisture wicking performance pique', 3500,
    'https://cdn.inksoft.com/images/products/6582/products/88181_BRH_SCREEN/PLATINUM/front/500.png?decache=638255374682670000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015009',
    '{"Color":["PLATINUM","Black","TRUE ROYAL","WHITE"],"Size":["Mens XS","Mens S","Mens M","Mens L","Mens XL","Mens 2XL","Mens 3XL","Mens 4XL"]}',
    '{"Size":{"Mens 2XL":200,"Mens 3XL":300,"Mens 4XL":500}}', '[]', 7
  ),
  (
    '1015019', 'Bright Harbor Healthcare Ladies'' Origin Performance Piqué Polo',
    'CORE365 · Moisture wicking performance pique', 3500,
    'https://cdn.inksoft.com/images/products/6582/products/781811_BRH_SCREEN/PLATINUM/front/500.png?decache=638258761667070000',
    'https://stores.farrostees.com/bright_harbor_healthcare/shop/product-detail/1015019',
    '{"Color":["PLATINUM","Black","TRUE ROYAL","WHITE"],"Size":["Ladies XS","Ladies S","Ladies M","Ladies L","Ladies XL","Ladies 2XL","Ladies 3XL"]}',
    '{"Size":{"Ladies 2XL":200,"Ladies 3XL":300}}', '[]', 8
  )
on conflict (source_product_id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  source_url = excluded.source_url,
  options = excluded.options,
  option_price_adjustments = excluded.option_price_adjustments,
  personalization_fields = excluded.personalization_fields,
  sort_order = excluded.sort_order,
  active = true;
