-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_schema.sql — core e-commerce schema
-- ─────────────────────────────────────────────────────────────────────────────
-- All prices are integers in XOF (FCFA has no minor unit / decimals).

create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');
exception when duplicate_object then null; end $$;

-- updated_at helper ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin allowlist (single admin role to start; supports adding more rows) -----
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Returns true when the current authenticated user's email is in admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Products -------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  status product_status not null default 'draft',
  base_price_xof integer not null check (base_price_xof >= 0),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_featured_idx on public.products (featured) where featured;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Product images -------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  position integer not null default 0
);
create index if not exists product_images_product_idx
  on public.product_images (product_id, position);

-- Product variants -----------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text,
  size text,
  color text,
  price_override_xof integer check (price_override_xof is null or price_override_xof >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0)
);
create index if not exists product_variants_product_idx
  on public.product_variants (product_id);
create unique index if not exists product_variants_sku_idx
  on public.product_variants (sku) where sku is not null;

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index if not exists product_categories_category_idx
  on public.product_categories (category_id);

-- Orders ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address jsonb not null default '{}'::jsonb,
  shipping_zone_id text,
  status order_status not null default 'pending',
  subtotal_xof integer not null check (subtotal_xof >= 0),
  shipping_xof integer not null default 0 check (shipping_xof >= 0),
  total_xof integer not null check (total_xof >= 0),
  wave_payment_ref text,
  wave_checkout_url text,
  created_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- snapshot fields so historical orders survive product edits/deletes
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_xof integer not null check (unit_price_xof >= 0),
  line_total_xof integer not null check (line_total_xof >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Stock decrement helper, used when an order is marked paid. Decrements each
-- variant atomically and guards against going negative (block-at-zero policy).
create or replace function public.decrement_variant_stock(p_variant_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants
    set stock_qty = stock_qty - p_qty
    where id = p_variant_id and stock_qty >= p_qty;
  if not found then
    raise exception 'insufficient stock for variant %', p_variant_id
      using errcode = 'check_violation';
  end if;
end;
$$;
