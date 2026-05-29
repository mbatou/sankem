import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatXOF } from "@/lib/money";
import { statusStyle } from "../orders-table";
import { OrderStatusControls } from "./status-controls";

export const metadata = { title: "Order" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_name, quantity, unit_price_xof, line_total_xof")
    .eq("order_id", id);

  const address = (order.shipping_address ?? {}) as {
    address_line?: string;
    city?: string;
    notes?: string;
    zone_label?: string;
  };

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-neutral-400 hover:text-white">
        ← Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`rounded px-2.5 py-1 text-sm capitalize ${statusStyle[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {(items ?? []).map((it, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3">
                    {it.product_name}
                    {it.variant_name && (
                      <span className="block text-xs text-neutral-500">{it.variant_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{it.quantity}</td>
                  <td className="px-4 py-3 tabular-nums">{formatXOF(it.unit_price_xof)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatXOF(it.line_total_xof)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-800 text-sm">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-neutral-400">
                  Subtotal
                </td>
                <td className="px-4 py-2 tabular-nums">{formatXOF(order.subtotal_xof)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-neutral-400">
                  Delivery
                </td>
                <td className="px-4 py-2 tabular-nums">{formatXOF(order.shipping_xof)}</td>
              </tr>
              <tr className="font-medium">
                <td colSpan={3} className="px-4 py-2 text-right">
                  Total
                </td>
                <td className="px-4 py-2 tabular-nums">{formatXOF(order.total_xof)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-lg border border-neutral-800 p-4 text-sm">
            <h2 className="mb-2 font-medium text-neutral-300">Customer</h2>
            <p>{order.customer_name}</p>
            <p className="text-neutral-400">{order.customer_phone}</p>
            {order.customer_email && <p className="text-neutral-400">{order.customer_email}</p>}
          </section>

          <section className="rounded-lg border border-neutral-800 p-4 text-sm">
            <h2 className="mb-2 font-medium text-neutral-300">Delivery</h2>
            {address.zone_label && <p className="text-neutral-400">{address.zone_label}</p>}
            <p>{[address.address_line, address.city].filter(Boolean).join(", ")}</p>
            {address.notes && <p className="mt-2 text-neutral-500">“{address.notes}”</p>}
          </section>

          {order.wave_payment_ref && (
            <section className="rounded-lg border border-neutral-800 p-4 text-sm">
              <h2 className="mb-2 font-medium text-neutral-300">Wave</h2>
              <p className="break-all text-neutral-400">Ref: {order.wave_payment_ref}</p>
            </section>
          )}

          <section className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-medium text-neutral-300">Update status</h2>
            <OrderStatusControls orderId={order.id} current={order.status} />
          </section>
        </aside>
      </div>
    </div>
  );
}
