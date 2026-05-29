import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatXOF } from "@/lib/money";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid — thank you",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, subtotal_xof, shipping_xof, total_xof, shipping_address, created_at",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_name, quantity, unit_price_xof, line_total_xof")
    .eq("order_id", order.id);

  const address = (order.shipping_address ?? {}) as {
    address_line?: string;
    city?: string;
    zone_label?: string;
  };

  return (
    <main className="container-editorial max-w-2xl py-16">
      <span className="h-px w-16 bg-gold" aria-hidden />
      <h1 className="mt-6 font-serif text-4xl">Thank you, {order.customer_name.split(" ")[0]}.</h1>
      <p className="mt-3 text-paper/60">
        Order <span className="text-gold">{order.order_number}</span> ·{" "}
        {statusLabel[order.status] ?? order.status}
      </p>

      <div className="mt-10 border border-paper/10">
        <ul className="divide-y divide-paper/10">
          {(items ?? []).map((it, idx) => (
            <li key={idx} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
              <div>
                <p>{it.product_name}</p>
                {it.variant_name && <p className="text-xs text-paper/50">{it.variant_name}</p>}
                <p className="text-xs text-paper/50">Qty {it.quantity}</p>
              </div>
              <span className="price">{formatXOF(it.line_total_xof)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-paper/10 px-5 py-4 text-sm">
          <div className="flex justify-between text-paper/70">
            <dt>Subtotal</dt>
            <dd>{formatXOF(order.subtotal_xof)}</dd>
          </div>
          <div className="flex justify-between text-paper/70">
            <dt>Delivery{address.zone_label ? ` — ${address.zone_label}` : ""}</dt>
            <dd>{formatXOF(order.shipping_xof)}</dd>
          </div>
          <div className="flex justify-between border-t border-paper/10 pt-3 text-base">
            <dt>Total</dt>
            <dd className="price">{formatXOF(order.total_xof)}</dd>
          </div>
        </dl>
      </div>

      {(address.address_line || address.city) && (
        <p className="mt-6 text-sm text-paper/50">
          Delivering to: {[address.address_line, address.city].filter(Boolean).join(", ")}
        </p>
      )}

      <Link href="/shop" className="btn-outline mt-10">
        Continue shopping
      </Link>
    </main>
  );
}
