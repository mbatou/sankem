import type { Metadata } from "next";
import { getCategories, getShopProducts } from "@/lib/queries";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ShopFilters } from "./shop-filters";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the collection.",
};

type Sort = "newest" | "price-asc" | "price-desc";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const validSort: Sort = sort === "price-asc" || sort === "price-desc" ? sort : "newest";

  const [categories, products] = await Promise.all([
    getCategories(),
    getShopProducts({ categorySlug: category, sort: validSort }),
  ]);

  return (
    <main className="container-editorial py-12">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl">Shop</h1>
        <p className="mt-2 text-sm text-paper/50">{products.length} pieces</p>
      </header>

      <ShopFilters categories={categories} activeCategory={category ?? null} activeSort={validSort} />

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </main>
  );
}
