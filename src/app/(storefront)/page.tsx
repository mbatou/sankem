import Link from "next/link";
import Image from "next/image";
import { brand } from "@/config/brand";
import { getFeaturedProducts } from "@/lib/queries";
import { ProductGrid } from "@/components/storefront/product-grid";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedProducts(6);
  const hero = featured.find((p) => p.coverUrl) ?? featured[0];

  return (
    <main>
      {/* Hero — full-bleed, editorial */}
      <section className="relative flex min-h-[88dvh] items-end overflow-hidden">
        {hero?.coverUrl ? (
          <Image
            src={hero.coverUrl}
            alt={hero.coverAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-ink-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="container-editorial relative z-10 pb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-paper/70">{brand.tagline}</p>
          <h1 className="mt-4 max-w-2xl text-5xl leading-[0.95] sm:text-7xl">{brand.name}</h1>
          <Link href="/shop" className="btn-outline mt-8">
            Enter the shop
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section className="container-editorial py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-3xl sm:text-4xl">Featured</h2>
          <Link href="/shop" className="text-xs uppercase tracking-[0.15em] text-paper/60 hover:text-gold">
            View all
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {/* Brand statement */}
      <section id="about" className="border-t border-paper/10">
        <div className="container-editorial grid gap-8 py-20 sm:grid-cols-[1fr_2fr]">
          <h2 className="text-sm uppercase tracking-[0.2em] text-gold">The house</h2>
          <p className="max-w-2xl font-serif text-2xl leading-snug sm:text-3xl">{brand.statement}</p>
        </div>
      </section>
    </main>
  );
}
