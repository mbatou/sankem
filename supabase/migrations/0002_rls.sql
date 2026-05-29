-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_rls.sql — Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
-- Public (anon + authenticated non-admin) can read only ACTIVE products and
-- their images/variants, plus categories. Everything else (all writes, draft/
-- archived reads, orders) requires an admin. Orders are created server-side
-- with the service-role key (which bypasses RLS), so no public insert policy is
-- exposed.

alter table public.admins             enable row level security;
alter table public.products           enable row level security;
alter table public.product_images     enable row level security;
alter table public.product_variants   enable row level security;
alter table public.categories         enable row level security;
alter table public.product_categories enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;

-- admins: only admins may read the allowlist; no client writes.
drop policy if exists admins_admin_read on public.admins;
create policy admins_admin_read on public.admins
  for select using (public.is_admin());

-- products -------------------------------------------------------------------
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (status = 'active' or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_images -------------------------------------------------------------
drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );

drop policy if exists product_images_admin_write on public.product_images;
create policy product_images_admin_write on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- product_variants -----------------------------------------------------------
drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );

drop policy if exists product_variants_admin_write on public.product_variants;
create policy product_variants_admin_write on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- categories -----------------------------------------------------------------
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- product_categories ---------------------------------------------------------
drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_public_read on public.product_categories
  for select using (true);

drop policy if exists product_categories_admin_write on public.product_categories;
create policy product_categories_admin_write on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- orders & order_items -------------------------------------------------------
-- Readable by admins only. Writes happen via the service role (server actions /
-- webhooks), which bypasses RLS entirely.
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
  for select using (public.is_admin());

drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items
  for select using (public.is_admin());

drop policy if exists order_items_admin_write on public.order_items;
create policy order_items_admin_write on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());
