"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBag, bagSubtotal, itemKey } from "@/lib/bag/store";
import { formatXOF } from "@/lib/money";
import { deliveryZones } from "@/config/brand";
import { createCheckout, type CheckoutInput } from "@/lib/actions/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useBag((s) => s.items);
  const clear = useBag((s) => s.clear);
  const [zoneId, setZoneId] = useState(deliveryZones[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = bagSubtotal(items);
  const zone = useMemo(() => deliveryZones.find((z) => z.id === zoneId), [zoneId]);
  const shipping = zone?.fee_xof ?? 0;
  const total = subtotal + shipping;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Your bag is empty.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input: CheckoutInput = {
      customer_name: String(fd.get("customer_name") ?? ""),
      customer_phone: String(fd.get("customer_phone") ?? ""),
      customer_email: String(fd.get("customer_email") ?? ""),
      address_line: String(fd.get("address_line") ?? ""),
      city: String(fd.get("city") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      zoneId,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };

    setSubmitting(true);
    try {
      const res = await createCheckout(input);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      // Order placed (pay on delivery) — clear the bag and show confirmation.
      clear();
      router.push(`/order/${res.orderNumber}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="container-editorial flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <h1 className="font-serif text-3xl">Your bag is empty</h1>
        <Link href="/shop" className="btn-outline mt-6">
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="container-editorial py-12">
      <h1 className="text-4xl sm:text-5xl">Checkout</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-xs uppercase tracking-[0.18em] text-paper/50">
              Contact
            </legend>
            <Input name="customer_name" label="Full name" required autoComplete="name" />
            <Input
              name="customer_phone"
              label="Phone (for Wave)"
              required
              type="tel"
              autoComplete="tel"
              placeholder="+221 ..."
            />
            <Input
              name="customer_email"
              label="Email (optional)"
              type="email"
              autoComplete="email"
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-xs uppercase tracking-[0.18em] text-paper/50">
              Delivery
            </legend>
            <Input name="address_line" label="Address" required autoComplete="street-address" />
            <Input name="city" label="City / neighbourhood" autoComplete="address-level2" />

            <label className="block text-sm">
              <span className="text-paper/60">Delivery zone</span>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="mt-1 w-full border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-gold"
              >
                {deliveryZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label} — {formatXOF(z.fee_xof)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-paper/60">Notes (optional)</span>
              <textarea
                name="notes"
                rows={3}
                className="mt-1 w-full resize-y border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-gold"
              />
            </label>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full">
            {submitting ? "Placing order…" : `Place order · ${formatXOF(total)}`}
          </button>
          <p className="text-center text-xs text-paper/40">
            Payment on delivery — pay in cash when your order arrives.
          </p>
        </form>

        {/* Summary */}
        <aside className="h-fit border border-paper/10 p-6 lg:sticky lg:top-24">
          <h2 className="text-xs uppercase tracking-[0.18em] text-paper/50">Order summary</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {items.map((i) => (
              <li key={itemKey(i.productId, i.variantId)} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-ink-raised">
                  {i.imageUrl && (
                    <Image src={i.imageUrl} alt={i.name} fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <span>{i.name}</span>
                  {i.variantName && <span className="text-xs text-paper/50">{i.variantName}</span>}
                  <span className="text-xs text-paper/50">Qty {i.quantity}</span>
                </div>
                <span className="price text-sm">{formatXOF(i.unitPriceXof * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-paper/10 pt-4 text-sm">
            <Row label="Subtotal" value={formatXOF(subtotal)} />
            <Row label={`Delivery — ${zone?.label ?? ""}`} value={formatXOF(shipping)} />
            <div className="flex justify-between border-t border-paper/10 pt-3 text-base">
              <dt>Total</dt>
              <dd className="price">{formatXOF(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

function Input({
  name,
  label,
  ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="text-paper/60">{label}</span>
      <input
        name={name}
        {...rest}
        className="mt-1 w-full border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-gold"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-paper/70">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
