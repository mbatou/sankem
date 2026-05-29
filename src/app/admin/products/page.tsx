import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "./products-table";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, status, base_price_xof, featured, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Products</h1>
        <Link href="/admin/products/new" className="rounded bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">
          New product
        </Link>
      </div>
      <ProductsTable products={products ?? []} />
    </div>
  );
}
