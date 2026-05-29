import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getActiveProductSlugs } from "@/lib/queries";
import { formatXOF } from "@/lib/money";
import { brand } from "@/config/brand";
import { Gallery } from "./gallery";
import { PurchasePanel } from "./purchase-panel";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getActiveProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Supabase not reachable at build time — pages render on demand instead.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description: product.description.slice(0, 160) || `${product.name} — ${brand.name}`,
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: image ? [{ url: image, width: 1200, height: 1600 }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const lowest = Math.min(
    product.base_price_xof,
    ...product.variants.map((v) => v.price_override_xof ?? product.base_price_xof),
  );

  return (
    <main className="container-editorial py-8 lg:py-12">
      <nav className="mb-6 text-xs uppercase tracking-[0.12em] text-paper/40">
        <Link href="/shop" className="hover:text-gold">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-paper/60">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <Gallery images={product.images} viewTransitionId={product.id} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="price mt-3 text-xl">{formatXOF(lowest)}</p>

          {product.description && (
            <div className="mt-6 whitespace-pre-line text-paper/70 leading-relaxed">
              {product.description}
            </div>
          )}

          <div className="mt-8">
            <PurchasePanel product={product} />
          </div>

          {product.categories.length > 0 && (
            <p className="mt-8 text-xs uppercase tracking-[0.12em] text-paper/40">
              {product.categories.map((c) => c.name).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
