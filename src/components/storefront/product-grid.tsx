"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatXOF } from "@/lib/money";
import type { ProductCard } from "@/lib/queries";

export function ProductGrid({ products }: { products: ProductCard[] }) {
  const [peek, setPeek] = useState<ProductCard | null>(null);

  if (products.length === 0) {
    return <p className="py-24 text-center text-paper/40">No pieces here yet.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i % 3}>
            <Card product={p} onPeek={() => setPeek(p)} />
          </Reveal>
        ))}
      </ul>
      {peek && <QuickView product={peek} onClose={() => setPeek(null)} />}
    </>
  );
}

function Card({ product, onPeek }: { product: ProductCard; onPeek: () => void }) {
  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink-raised">
          {product.coverUrl ? (
            <Image
              src={product.coverUrl}
              alt={product.coverAlt}
              fill
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              style={{ viewTransitionName: `product-${product.id}` }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-paper/20">No image</div>
          )}
          {!product.inStock && (
            <span className="absolute left-3 top-3 bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-widest text-paper/70">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={onPeek}
        className="absolute right-3 top-3 hidden border border-paper/30 bg-ink/60 px-3 py-1.5 text-[10px] uppercase tracking-widest backdrop-blur transition hover:border-gold hover:text-gold group-hover:block sm:group-focus-within:block"
      >
        Quick view
      </button>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Link href={`/product/${product.slug}`} className="font-serif text-lg hover:text-gold">
          {product.name}
        </Link>
        <span className="price text-sm">{formatXOF(product.price_xof)}</span>
      </div>
    </div>
  );
}

function QuickView({ product, onClose }: { product: ProductCard; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 animate-fade-in bg-black/70" aria-label="Close" onClick={onClose} />
      <div className="relative grid w-full max-w-3xl animate-reveal-up grid-cols-1 overflow-hidden bg-ink-soft sm:grid-cols-2">
        <div className="relative aspect-[3/4] bg-ink-raised">
          {product.coverUrl && (
            <Image src={product.coverUrl} alt={product.coverAlt} fill sizes="50vw" className="object-cover" />
          )}
        </div>
        <div className="flex flex-col p-8">
          <h3 className="font-serif text-2xl">{product.name}</h3>
          <p className="price mt-2">{formatXOF(product.price_xof)}</p>
          <p className="mt-4 text-sm text-paper/50">
            {product.inStock ? "In stock" : "Currently sold out"}
          </p>
          <div className="mt-auto pt-8">
            <Link href={`/product/${product.slug}`} className="btn-primary w-full" onClick={onClose}>
              View product
            </Link>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-paper/60 hover:text-gold"
          aria-label="Close quick view"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Scroll-reveal wrapper using IntersectionObserver. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLLIElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={shown ? "animate-reveal-up" : "opacity-0"}
      style={shown ? { animationDelay: `${delay * 90}ms` } : undefined}
    >
      {children}
    </li>
  );
}
