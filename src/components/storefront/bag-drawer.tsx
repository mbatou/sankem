"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBag, bagSubtotal, itemKey } from "@/lib/bag/store";
import { formatXOF } from "@/lib/money";

export function BagDrawer() {
  const { isOpen, close, items, setQty, remove } = useBag();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const subtotal = bagSubtotal(items);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        className="absolute inset-0 animate-fade-in bg-black/60"
        aria-label="Close bag"
        onClick={close}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md animate-drawer-in flex-col bg-ink-soft outline-none"
      >
        <div className="flex items-center justify-between border-b border-paper/10 px-6 py-5">
          <h2 className="font-serif text-xl">Your bag</h2>
          <button onClick={close} className="text-sm text-paper/60 hover:text-gold" aria-label="Close">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="py-16 text-center text-paper/50">Your bag is empty.</p>
          ) : (
            <ul className="divide-y divide-paper/10">
              {items.map((i) => {
                const key = itemKey(i.productId, i.variantId);
                return (
                  <li key={key} className="flex gap-4 py-5">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink-raised">
                      {i.imageUrl && (
                        <Image src={i.imageUrl} alt={i.name} fill sizes="80px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <div>
                          <Link
                            href={`/product/${i.slug}`}
                            onClick={close}
                            className="text-sm hover:text-gold"
                          >
                            {i.name}
                          </Link>
                          {i.variantName && (
                            <p className="text-xs text-paper/50">{i.variantName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(key)}
                          className="text-xs text-paper/40 hover:text-gold"
                          aria-label={`Remove ${i.name}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="inline-flex items-center border border-paper/20">
                          <button
                            onClick={() => setQty(key, i.quantity - 1)}
                            className="px-3 py-1 hover:text-gold"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm tabular-nums">{i.quantity}</span>
                          <button
                            onClick={() => setQty(key, i.quantity + 1)}
                            disabled={i.maxQty != null && i.quantity >= i.maxQty}
                            className="px-3 py-1 hover:text-gold disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="price text-sm">{formatXOF(i.unitPriceXof * i.quantity)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-paper/10 px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-paper/60">Subtotal</span>
              <span className="price text-base">{formatXOF(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-paper/40">Delivery calculated at checkout.</p>
            <button
              onClick={() => {
                close();
                router.push("/checkout");
              }}
              className="btn-primary mt-4 w-full"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
