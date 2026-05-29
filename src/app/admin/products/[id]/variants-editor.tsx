"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveVariants } from "@/lib/actions/products";
import type { ProductVariantRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  name: string;
  size: string;
  color: string;
  sku: string;
  price_override_xof: string;
  stock_qty: string;
};

function toDraft(v: ProductVariantRow): Draft {
  return {
    id: v.id,
    name: v.name,
    size: v.size ?? "",
    color: v.color ?? "",
    sku: v.sku ?? "",
    price_override_xof: v.price_override_xof != null ? String(v.price_override_xof) : "",
    stock_qty: String(v.stock_qty),
  };
}

const empty: Draft = { name: "", size: "", color: "", sku: "", price_override_xof: "", stock_qty: "0" };

export function VariantsEditor({
  productId,
  initialVariants,
}: {
  productId: string;
  initialVariants: ProductVariantRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Draft[]>(initialVariants.map(toDraft));
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function update(i: number, patch: Partial<Draft>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ...empty }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Auto-name from size/color if name left blank.
  function autoName(r: Draft): string {
    if (r.name.trim()) return r.name.trim();
    return [r.size, r.color].filter(Boolean).join(" / ") || "Default";
  }

  function save() {
    setMsg(null);
    const payload = rows.map((r) => ({
      id: r.id,
      name: autoName(r),
      size: r.size || null,
      color: r.color || null,
      sku: r.sku || null,
      price_override_xof: r.price_override_xof === "" ? null : Number(r.price_override_xof),
      stock_qty: Number(r.stock_qty || 0),
    }));
    startTransition(async () => {
      const res = await saveVariants(productId, payload);
      if (res.ok) {
        setMsg({ kind: "ok", text: "Variants saved." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-neutral-500">
            <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:font-medium">
              <th>Size</th>
              <th>Colour</th>
              <th>SKU</th>
              <th>Price override</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`} className="[&>td]:px-1 [&>td]:py-1">
                <td>
                  <input value={r.size} onChange={(e) => update(i, { size: e.target.value })} className={cell} placeholder="M" />
                </td>
                <td>
                  <input value={r.color} onChange={(e) => update(i, { color: e.target.value })} className={cell} placeholder="Black" />
                </td>
                <td>
                  <input value={r.sku} onChange={(e) => update(i, { sku: e.target.value })} className={cell} placeholder="optional" />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={r.price_override_xof}
                    onChange={(e) => update(i, { price_override_xof: e.target.value })}
                    className={cell}
                    placeholder="base"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={r.stock_qty}
                    onChange={(e) => update(i, { stock_qty: e.target.value })}
                    className={`${cell} w-20`}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="px-2 text-red-400 hover:text-red-300"
                    aria-label="Remove variant"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-neutral-500">
                  No variants. Add one below (a single &ldquo;Default&rdquo; variant is fine).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
        >
          + Add variant
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save variants"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

const cell =
  "w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 outline-none focus:border-neutral-500";
