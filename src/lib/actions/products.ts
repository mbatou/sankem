"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { PRODUCT_BUCKET } from "@/lib/images";
import type { ProductStatus } from "@/lib/types/database";

const statusSchema = z.enum(["draft", "active", "archived"]);

function revalidateAll(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  revalidatePath("/");
}

/** Ensure a slug is unique, appending a short suffix on collision. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  desired: string,
  ignoreId?: string,
): Promise<string> {
  const baseSlug = slugify(desired) || "product";
  let candidate = baseSlug;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

// ── Create ───────────────────────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("base_price_xof") ?? 0);
  if (!name) throw new Error("Name is required");

  const slug = await uniqueSlug(supabase, String(formData.get("slug") || name));
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      base_price_xof: Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll(data.id);
  redirect(`/admin/products/${data.id}`);
}

// ── Update details ─────────────────────────────────────────────────────────-
const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1),
  description: z.string().default(""),
  status: statusSchema,
  base_price_xof: z.coerce.number().int().min(0),
  featured: z.boolean(),
});

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = updateSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    base_price_xof: formData.get("base_price_xof"),
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = await uniqueSlug(supabase, parsed.data.slug, id);
  const { error } = await supabase
    .from("products")
    .update({ ...parsed.data, slug })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };
  revalidateAll(id);
  return { ok: true as const, slug };
}

export async function setProductStatus(id: string, status: ProductStatus) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll(id);
}

// ── Duplicate ────────────────────────────────────────────────────────────────
export async function duplicateProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: src, error }, { data: srcVariants }, { data: srcCats }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("product_variants").select("*").eq("product_id", id),
    supabase.from("product_categories").select("category_id").eq("product_id", id),
  ]);
  if (error || !src) throw new Error(error?.message ?? "Product not found");

  const slug = await uniqueSlug(supabase, `${src.slug}-copy`);
  const { data: copy, error: insErr } = await supabase
    .from("products")
    .insert({
      name: `${src.name} (copy)`,
      slug,
      description: src.description,
      status: "draft",
      base_price_xof: src.base_price_xof,
      featured: false,
    })
    .select("id")
    .single();
  if (insErr || !copy) throw new Error(insErr?.message ?? "Could not duplicate");

  if (srcVariants && srcVariants.length) {
    await supabase.from("product_variants").insert(
      srcVariants.map((v) => ({
        product_id: copy.id,
        name: v.name,
        sku: null, // sku is unique — clear on copy
        size: v.size,
        color: v.color,
        price_override_xof: v.price_override_xof,
        stock_qty: v.stock_qty,
      })),
    );
  }
  if (srcCats && srcCats.length) {
    await supabase
      .from("product_categories")
      .insert(srcCats.map((c) => ({ product_id: copy.id, category_id: c.category_id })));
  }
  // Note: images are intentionally not copied (they share storage objects).

  revalidateAll(copy.id);
  redirect(`/admin/products/${copy.id}`);
}

// ── Images ─────────────────────────────────────────────────────────────────-
export async function addProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "No file provided" };
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { ok: false as const, error: upErr.message };

  // Append after existing images.
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: path,
      alt: "",
      position: count ?? 0,
    })
    .select("*")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidateAll(productId);
  return { ok: true as const, image: data };
}

/**
 * Record an image that was already uploaded to Storage directly from the
 * browser (avoids the Server Action / serverless request body-size limits).
 * Only the small path string crosses the wire here.
 */
export async function registerProductImage(productId: string, storagePath: string, alt = "") {
  await requireAdmin();
  const supabase = await createClient();

  if (!storagePath || !storagePath.startsWith(`${productId}/`)) {
    return { ok: false as const, error: "Invalid storage path" };
  }

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: storagePath, alt, position: count ?? 0 })
    .select("*")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidateAll(productId);
  return { ok: true as const, image: data };
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("product_id, storage_path")
    .eq("id", imageId)
    .single();
  if (img) {
    await supabase.storage.from(PRODUCT_BUCKET).remove([img.storage_path]);
    await supabase.from("product_images").delete().eq("id", imageId);
    revalidateAll(img.product_id);
  }
  return { ok: true as const };
}

export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from("product_images").update({ position }).eq("id", id).eq("product_id", productId),
    ),
  );
  revalidateAll(productId);
  return { ok: true as const };
}

export async function updateImageAlt(imageId: string, alt: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("product_images").update({ alt }).eq("id", imageId);
  return { ok: true as const };
}

// ── Variants ─────────────────────────────────────────────────────────────────
const variantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  sku: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  price_override_xof: z.coerce.number().int().min(0).nullable().optional(),
  stock_qty: z.coerce.number().int().min(0),
});

export async function saveVariants(
  productId: string,
  variants: z.input<typeof variantSchema>[],
) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = z.array(variantSchema).safeParse(variants);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid variant data" };
  }

  // Delete variants no longer present.
  const keepIds = parsed.data.filter((v) => v.id).map((v) => v.id!) as string[];
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !keepIds.includes(id));
  if (toDelete.length) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }

  for (const v of parsed.data) {
    const row = {
      product_id: productId,
      name: v.name,
      sku: v.sku || null,
      size: v.size || null,
      color: v.color || null,
      price_override_xof: v.price_override_xof ?? null,
      stock_qty: v.stock_qty,
    };
    if (v.id) {
      const { error } = await supabase.from("product_variants").update(row).eq("id", v.id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("product_variants").insert(row);
      if (error) return { ok: false as const, error: error.message };
    }
  }

  revalidateAll(productId);
  return { ok: true as const };
}

// ── Categories ─────────────────────────────────────────────────────────────-
export async function setProductCategories(productId: string, categoryIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (categoryIds.length) {
    await supabase
      .from("product_categories")
      .insert(categoryIds.map((category_id) => ({ product_id: productId, category_id })));
  }
  revalidateAll(productId);
  return { ok: true as const };
}
