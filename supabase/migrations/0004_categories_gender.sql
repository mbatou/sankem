-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_categories_gender.sql — add Man / Woman categories
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.categories (name, slug) values
  ('Man', 'man'),
  ('Woman', 'woman')
on conflict (slug) do nothing;
