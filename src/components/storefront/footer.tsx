import Link from "next/link";
import { brand } from "@/config/brand";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-paper/10">
      <div className="container-editorial flex flex-col gap-8 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-2xl">{brand.name}</p>
          <p className="mt-2 max-w-xs text-sm text-paper/50">{brand.tagline}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-paper/60">
          <Link href="/shop" className="hover:text-gold">
            Shop
          </Link>
          <a href={brand.social.instagram} className="hover:text-gold" rel="noreferrer">
            Instagram
          </a>
          <a href={`mailto:${brand.social.email}`} className="hover:text-gold">
            {brand.social.email}
          </a>
        </nav>
      </div>
      <div className="container-editorial pb-8 text-xs text-paper/30">
        © {new Date().getFullYear()} {brand.name}. Paiement via Wave · FCFA.
      </div>
    </footer>
  );
}
