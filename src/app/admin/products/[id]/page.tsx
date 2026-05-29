import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { storagePublicUrl } from "@/lib/images";
import { ProductEditor } from "./product-editor";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: images }, { data: variants }, { data: categories }, { data: assigned }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("product_images").select("*").eq("product_id", id).order("position"),
      supabase.from("product_variants").select("*").eq("product_id", id).order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("product_categories").select("category_id").eq("product_id", id),
    ]);

  if (!product) notFound();

  const imagesWithUrls = (images ?? []).map((img) => ({
    ...img,
    url: storagePublicUrl(img.storage_path),
  }));

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-neutral-400 hover:text-white">
        ← Products
      </Link>
      <ProductEditor
        product={product}
        images={imagesWithUrls}
        variants={variants ?? []}
        categories={categories ?? []}
        assignedCategoryIds={(assigned ?? []).map((a) => a.category_id)}
      />
    </div>
  );
}
