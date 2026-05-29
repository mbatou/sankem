"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BagItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  unitPriceXof: number;
  imageUrl: string | null;
  /** Max purchasable (variant stock). null = untracked/no limit. */
  maxQty: number | null;
  quantity: number;
};

type BagState = {
  items: BagItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<BagItem, "quantity">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

/** Stable key for a line item (product + variant). */
export function itemKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "_"}`;
}

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (item, qty = 1) =>
        set((s) => {
          const key = itemKey(item.productId, item.variantId);
          const existing = s.items.find(
            (i) => itemKey(i.productId, i.variantId) === key,
          );
          const cap = (n: number) => (item.maxQty != null ? Math.min(n, item.maxQty) : n);
          if (existing) {
            return {
              isOpen: true,
              items: s.items.map((i) =>
                itemKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: cap(i.quantity + qty) }
                  : i,
              ),
            };
          }
          return { isOpen: true, items: [...s.items, { ...item, quantity: cap(qty) }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              itemKey(i.productId, i.variantId) === key
                ? { ...i, quantity: i.maxQty != null ? Math.min(qty, i.maxQty) : qty }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      remove: (key) =>
        set((s) => ({
          items: s.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "sankem-bag", partialize: (s) => ({ items: s.items }) },
  ),
);

export function bagSubtotal(items: BagItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceXof * i.quantity, 0);
}

export function bagCount(items: BagItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
