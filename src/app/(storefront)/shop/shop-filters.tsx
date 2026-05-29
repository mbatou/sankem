"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryRow } from "@/lib/types/database";

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
];

export function ShopFilters({
  categories,
  activeCategory,
  activeSort,
}: {
  categories: CategoryRow[];
  activeCategory: string | null;
  activeSort: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/shop?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-paper/10 py-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-[0.12em]">
        <button
          onClick={() => setParam("category", null)}
          className={!activeCategory ? "text-gold" : "text-paper/60 hover:text-paper"}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParam("category", c.slug)}
            className={activeCategory === c.slug ? "text-gold" : "text-paper/60 hover:text-paper"}
          >
            {c.name}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-paper/60">
        Sort
        <select
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
          className="border border-paper/20 bg-ink px-2 py-1 text-paper outline-none focus:border-gold"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
