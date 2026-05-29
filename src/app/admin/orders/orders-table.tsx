"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatXOF } from "@/lib/money";
import type { OrderStatus } from "@/lib/types/database";

type Row = {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  total_xof: number;
  created_at: string;
};

const filters: Array<OrderStatus | "all"> = ["all", "pending", "paid", "fulfilled", "cancelled"];

export const statusStyle: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  fulfilled: "bg-sky-500/15 text-sky-400",
  cancelled: "bg-neutral-500/15 text-neutral-400",
};

export function OrdersTable({ orders }: { orders: Row[] }) {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const filtered = useMemo(
    () => (status === "all" ? orders : orders.filter((o) => o.status === status)),
    [orders, status],
  );

  return (
    <div className="mt-6">
      <div className="flex gap-1">
        {filters.map((s) => (
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

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyle[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatXOF(o.total_xof)}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(o.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
