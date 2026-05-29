"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { useBag, bagCount } from "@/lib/bag/store";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/#about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const open = useBag((s) => s.open);
  const items = useBag((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? bagCount(items) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink/80 backdrop-blur-md">
      <div className="container-editorial flex h-16 items-center justify-between">
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.15em]">
          {links.map((l) => {
            const active = l.href === "/shop" && pathname.startsWith("/shop");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors hover:text-gold ${active ? "text-gold" : "text-paper/80"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-serif text-xl tracking-tightest"
        >
          {brand.name}
        </Link>

        <button
          onClick={open}
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-paper/80 hover:text-gold"
          aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
        >
          Bag
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-paper/30 px-1 text-[11px] tabular-nums group-hover:border-gold">
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
