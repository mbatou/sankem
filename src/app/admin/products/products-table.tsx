"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXOF } from "@/lib/money";
import { duplicateProduct, setProductStatus } from "@/lib/actions/products";
import type { ProductStatus } from "@/lib/types/database";

type Row = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  base_price_xof: number;
  featured: boolean;
  updated_at: string;
};

const statusFilters: Array<ProductStatus | "all"> = ["all", "active", "draft", "archived"];

const statusStyle: Record<ProductStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-neutral-500/15 text-neutral-300",
  archived: "bg-amber-500/15 text-amber-400",
};

export function ProductsTable({ products }: { products: Row[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, status]);

  function archive(id: string) {
    startTransition(async () => {
      await setProductStatus(id, "archived");
      router.refresh();
    });
  }
  function duplicate(id: string) {
    startTransition(() => duplicateProduct(id));
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or slug…"
          className="w-64 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <div className="flex gap-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-3 py-1.5 text-sm capitalize ${
                status === s ? "bg-neutral-200 text-neutral-900" : "text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  {p.featured && <span className="ml-2 text-xs text-amber-400">★ featured</span>}
                  <div className="text-xs text-neutral-500">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyle[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatXOF(p.base_price_xof)}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(p.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    <Link href={`/admin/products/${p.id}`} className="text-neutral-300 hover:text-white">
                      Edit
                    </Link>
                    <button
                      onClick={() => duplicate(p.id)}
                      disabled={isPending}
                      className="text-neutral-400 hover:text-white disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    {p.status !== "archived" && (
                      <button
                        onClick={() => archive(p.id)}
                        disabled={isPending}
                        className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
