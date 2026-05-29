"use client";

import { useState } from "react";
import { useBag } from "@/lib/bag/store";
import { formatXOF } from "@/lib/money";
import type { ProductDetail } from "@/lib/queries";

export function PurchasePanel({ product }: { product: ProductDetail }) {
  const add = useBag((s) => s.add);
  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = product.variants.find((v) => v.id === variantId) ?? null;
  const cover = product.images[0]?.url ?? null;

  // Effective price + stock for the current selection.
  const unitPrice = selected?.price_override_xof ?? product.base_price_xof;
  const stock = selected ? selected.stock_qty : null;
  const soldOut = hasVariants
    ? product.variants.every((v) => v.stock_qty <= 0)
    : false;

  const canAdd = hasVariants ? !!selected && (stock ?? 0) > 0 : true;

  function handleAdd() {
    add(
      {
        productId: product.id,
        variantId: selected?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantName: selected?.name ?? null,
        unitPriceXof: unitPrice,
        imageUrl: cover,
        maxQty: selected ? selected.stock_qty : null,
      },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {hasVariants && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.15em] text-paper/50">Select</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stock_qty <= 0;
              const isSel = v.id === variantId;
              return (
                <button
                  key={v.id}
                  disabled={out}
                  onClick={() => setVariantId(v.id)}
                  className={`border px-4 py-2 text-sm transition-colors ${
                    isSel ? "border-gold text-gold" : "border-paper/25 hover:border-paper/60"
                  } ${out ? "cursor-not-allowed text-paper/25 line-through" : ""}`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
          {selected && (
            <p className="mt-3 text-xs text-paper/50">
              {selected.stock_qty > 0
                ? selected.stock_qty <= 5
                  ? `Only ${selected.stock_qty} left`
                  : "In stock"
                : "Sold out"}
              {" · "}
              {formatXOF(unitPrice)}
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!canAdd || soldOut}
        className="btn-primary mt-6 w-full"
      >
        {soldOut
          ? "Sold out"
          : hasVariants && !selected
            ? "Select an option"
            : added
              ? "Added ✓"
              : "Add to bag"}
      </button>

      {!hasVariants && (
        <p className="mt-3 text-xs text-paper/40">Ships from Dakar. Delivery calculated at checkout.</p>
      )}
    </div>
  );
}
