-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_storage.sql — product image bucket + storage policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Public-read bucket so next/image can fetch + transform product photos.
-- Writes (upload / update / delete) are restricted to admins.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admins manage product images insert" on storage.objects;
create policy "admins manage product images insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins manage product images update" on storage.objects;
create policy "admins manage product images update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins manage product images delete" on storage.objects;
create policy "admins manage product images delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
