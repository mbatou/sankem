-- ─────────────────────────────────────────────────────────────────────────────
-- seed.sql — minimal starter data
-- ─────────────────────────────────────────────────────────────────────────────
-- Run after migrations. Edit the admin email to match your Supabase Auth user.
-- The auth user itself must be created in the Supabase dashboard (Auth > Users)
-- or via sign-up; this row simply allowlists that email for admin access.

insert into public.admins (email) values
  ('georgesmbatoucharles@gmail.com')
on conflict (email) do nothing;

insert into public.categories (name, slug) values
  ('Outerwear', 'outerwear'),
  ('Knitwear', 'knitwear'),
  ('Tailoring', 'tailoring'),
  ('Accessories', 'accessories')
on conflict (slug) do nothing;
