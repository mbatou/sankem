import { createPublicClient } from "@/lib/supabase/public";
import { storagePublicUrl } from "@/lib/images";
import type {
  CategoryRow,
  ProductRow,
  ProductImageRow,
  ProductVariantRow,
} from "@/lib/types/database";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price_xof: number; // lowest available price
  featured: boolean;
  coverUrl: string | null;
  coverAlt: string;
  inStock: boolean;
};

export type ProductDetail = ProductRow & {
  images: Array<ProductImageRow & { url: string }>;
  variants: ProductVariantRow[];
  categories: CategoryRow[];
};

/** True only when Supabase env is present (false during a build without env). */
function configured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Lowest price across base + variant overrides. */
function lowestPrice(base: number, variants: Pick<ProductVariantRow, "price_override_xof">[]) {
  const prices = [base, ...variants.map((v) => v.price_override_xof ?? base)];
  return Math.min(...prices);
}

export async function getCategories(): Promise<CategoryRow[]> {
  if (!configured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

export async function getShopProducts(opts: {
  categorySlug?: string;
  sort?: "newest" | "price-asc" | "price-desc";
} = {}): Promise<ProductCard[]> {
  if (!configured()) return [];
  const supabase = createPublicClient();

  // Restrict to a category if requested.
  let allowedIds: string[] | null = null;
  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (!cat) return [];
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", cat.id);
    allowedIds = (links ?? []).map((l) => l.product_id);
    if (allowedIds.length === 0) return [];
  }

  let q = supabase
    .from("products")
    .select("id, name, slug, base_price_xof, featured, created_at")
    .eq("status", "active");
  if (allowedIds) q = q.in("id", allowedIds);
  const { data: products } = await q.order("created_at", { ascending: false });
  if (!products || products.length === 0) return [];

  const ids = products.map((p) => p.id);
  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from("product_images")
      .select("product_id, storage_path, alt, position")
      .in("product_id", ids)
      .order("position"),
    supabase
      .from("product_variants")
      .select("product_id, price_override_xof, stock_qty")
      .in("product_id", ids),
  ]);

  const coverByProduct = new Map<string, { storage_path: string; alt: string }>();
  for (const img of images ?? []) {
    if (!coverByProduct.has(img.product_id)) {
      coverByProduct.set(img.product_id, { storage_path: img.storage_path, alt: img.alt });
    }
  }
  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  for (const v of variants ?? []) {
    const arr = variantsByProduct.get(v.product_id) ?? [];
    arr.push(v as ProductVariantRow);
    variantsByProduct.set(v.product_id, arr);
  }

  let cards: ProductCard[] = products.map((p) => {
    const cover = coverByProduct.get(p.id);
    const vs = variantsByProduct.get(p.id) ?? [];
    const stock = vs.reduce((sum, v) => sum + (v.stock_qty ?? 0), 0);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      featured: p.featured,
      price_xof: lowestPrice(p.base_price_xof, vs),
      coverUrl: cover ? storagePublicUrl(cover.storage_path) : null,
      coverAlt: cover?.alt || p.name,
      // No variants => treat base product as available (oversell n/a here).
      inStock: vs.length === 0 ? true : stock > 0,
    };
  });

  if (opts.sort === "price-asc") cards = cards.sort((a, b) => a.price_xof - b.price_xof);
  else if (opts.sort === "price-desc") cards = cards.sort((a, b) => b.price_xof - a.price_xof);
  // "newest" is the default order from the query.

  return cards;
}

export async function getFeaturedProducts(limit = 6): Promise<ProductCard[]> {
  const cards = await getShopProducts({ sort: "newest" });
  const featured = cards.filter((c) => c.featured);
  return (featured.length ? featured : cards).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!configured()) return null;
  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!product) return null;

  const [{ data: images }, { data: variants }, { data: catLinks }] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", product.id).order("position"),
    supabase.from("product_variants").select("*").eq("product_id", product.id).order("name"),
    supabase.from("product_categories").select("category_id").eq("product_id", product.id),
  ]);

  let categories: CategoryRow[] = [];
  const catIds = (catLinks ?? []).map((c) => c.category_id);
  if (catIds.length) {
    const { data: cats } = await supabase.from("categories").select("*").in("id", catIds);
    categories = cats ?? [];
  }

  return {
    ...product,
    images: (images ?? []).map((img) => ({ ...img, url: storagePublicUrl(img.storage_path) })),
    variants: variants ?? [],
    categories,
  };
}

export async function getActiveProductSlugs(): Promise<string[]> {
  if (!configured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("slug").eq("status", "active");
  return (data ?? []).map((p) => p.slug);
}
