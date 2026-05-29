const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET ?? "product-images";

function base(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

/** Public URL for a stored product image (bucket is public-read). */
export function storagePublicUrl(path: string): string {
  return `${base()}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Supabase image-transform URL — resized/optimized via the render endpoint.
 * Use for thumbnails where we want to ship fewer bytes than the original.
 */
export function storageTransformUrl(
  path: string,
  opts: { width?: number; height?: number; quality?: number; resize?: "cover" | "contain" } = {},
): string {
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  params.set("quality", String(opts.quality ?? 75));
  if (opts.resize) params.set("resize", opts.resize);
  return `${base()}/storage/v1/render/image/public/${BUCKET}/${path}?${params.toString()}`;
}

export const PRODUCT_BUCKET = BUCKET;
