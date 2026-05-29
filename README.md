# SANKEM — Fashion E-commerce Storefront + Admin

A mobile-first, editorial e-commerce site for a luxury fashion brand. Storefront
for browsing and buying, password-protected admin for catalog and orders.
Payments via **Wave** (mobile money, Senegal). Currency is **FCFA (XOF)**.

- **Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Supabase
  (Postgres + Auth + Storage + RLS).
- **Design:** minimal luxury — near-black, off-white, restrained gold. Fraunces
  (display serif) + Inter (sans). View Transitions, scroll-reveal, slide-in bag.

---

## Configuration locked at build

| Decision | Choice |
| --- | --- |
| Admin login | Email + password |
| Shipping | Delivery **zones** with per-zone fees (chosen at checkout) |
| Inventory | **Block purchase at 0 stock** (re-validated server-side; decremented on paid) |
| Admin accounts | Single admin role (email allowlist) |
| Branding | Placeholders in a swappable config — drop in real identity |

Brand name, palette, fonts, social links, and **delivery zones/fees** all live in
[`src/config/brand.ts`](src/config/brand.ts). Palette hex values are mirrored in
[`tailwind.config.ts`](tailwind.config.ts) (Tailwind needs literals at build time
— update both together).

---

## 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Wave](https://www.wave.com) business account for the Checkout Sessions API
- (Optional) the [Supabase CLI](https://supabase.com/docs/guides/cli) for
  migrations and type generation

## 2. Install

```bash
npm install
```

## 3. Environment

Copy the example and fill it in:

```bash
cp .env.example .env.local
```

| Var | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | client+server | Canonical URL, no trailing slash. Used for metadata, sitemap, and Wave callbacks. |
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | Public anon key (RLS-protected). |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. Used by checkout/webhook. Never expose. |
| `NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET` | client+server | Storage bucket name (default `product-images`). |
| `ADMIN_EMAILS` | server | Comma-separated allowlist for `/admin`. |
| `WAVE_API_KEY` | **server only** | Wave secret API key. |
| `WAVE_API_BASE_URL` | server | Wave API base. **TODO:** confirm exact value. |
| `WAVE_WEBHOOK_SECRET` | **server only** | Verifies inbound webhook signatures. |

## 4. Database

Apply the migrations in [`supabase/migrations`](supabase/migrations) (run in order):
`0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`.

**With the Supabase CLI:**

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # optional starter data
```

**Or** paste each migration into the Supabase Dashboard → SQL Editor and run it,
then run [`supabase/seed.sql`](supabase/seed.sql).

This creates all tables, RLS policies (public reads of active products; admin-only
writes and order access), the `is_admin()` helper, the `decrement_variant_stock`
RPC, and the public-read **`product-images`** storage bucket.

### Create the admin user

1. Supabase Dashboard → **Authentication → Users → Add user** (email + password).
2. Make sure that email is in both `ADMIN_EMAILS` (env) and the `admins` table
   (see `seed.sql`).

### Generate types (optional, after schema changes)

```bash
npm run gen:types   # supabase gen types typescript --linked > src/lib/types/database.ts
```

The committed [`database.ts`](src/lib/types/database.ts) already matches the
migrations, so the app is type-safe out of the box.

## 5. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
npm run lint
```

- Storefront: `/`, `/shop`, `/product/[slug]`, `/checkout`
- Admin: `/admin` (redirects to `/admin/login` if signed out)

## 6. Wave integration

The flow and verification are implemented in
[`src/lib/wave/client.ts`](src/lib/wave/client.ts) and wired through:

1. **Checkout** ([`createCheckout`](src/lib/actions/checkout.ts)) — re-prices the
   bag server-side, enforces block-at-zero stock, creates a `pending` order, then
   creates a Wave checkout session and redirects to its hosted URL.
2. **Success return** (`/checkout/success`) — re-fetches the session status from
   Wave (does **not** trust the redirect) and only then marks the order `paid`.
3. **Webhook** (`/api/wave/webhook`) — verifies the signature, then settles the
   order out-of-band (idempotent with the success handler).

> **TODO(wave):** The exact endpoint paths, request/response field names, and the
> webhook signature header/scheme are marked with `TODO(wave)` in
> `src/lib/wave/client.ts`. Fill in the precise values from Wave's docs. The
> surrounding logic (auth header, server-side verification, idempotent settle,
> stock decrement) is complete.

Point your Wave webhook at `https://<your-domain>/api/wave/webhook`.

## 7. Deploy

- **Storefront → Vercel.** Import the repo, set all env vars from the table above
  (mark `SUPABASE_SERVICE_ROLE_KEY`, `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` as
  server-side/secret), and set `NEXT_PUBLIC_SITE_URL` to the production URL.
- **Database/Auth/Storage → Supabase cloud** (already set up in step 4).
- Add your Vercel domain to Supabase Auth redirect/allowed URLs.

## Project structure

```
src/
  app/
    (storefront)/        home, shop, product, checkout, order — editorial UI
    admin/               login, dashboard, products, orders — clean admin UI
    api/wave/webhook/    Wave webhook endpoint
  components/storefront/ header, footer, bag drawer, product grid
  config/brand.ts        brand identity, palette, delivery zones (swap here)
  lib/
    supabase/            browser / server / service-role / public clients
    actions/             server actions (products, orders, checkout, auth)
    wave/                Wave Checkout Sessions wrapper (TODO(wave) markers)
    queries.ts           public storefront reads
    bag/store.ts         persisted client-side bag (zustand)
supabase/
  migrations/            schema, RLS, storage bucket
  seed.sql               admin allowlist + starter categories
```
