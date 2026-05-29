import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatXOF } from "@/lib/money";
import { statusStyle } from "./orders/orders-table";
import type { OrderStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: activeCount }, { data: recentOrders }, { data: monthPaid }] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, total_xof, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select("total_xof")
      .eq("status", "paid")
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const revenueThisMonth = (monthPaid ?? []).reduce((sum, o) => sum + o.total_xof, 0);
  const pendingCount = (recentOrders ?? []).filter((o) => o.status === "pending").length;

  return (
    <div>
      <h1 className="font-serif text-2xl">Dashboard</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Active products" value={String(activeCount ?? 0)} href="/admin/products" />
        <Stat label="Revenue this month" value={formatXOF(revenueThisMonth)} />
        <Stat
          label="Pending orders"
          value={String(pendingCount)}
          href="/admin/orders"
          hint="in recent orders"
        />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-neutral-400 hover:text-white">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-800">
              {(recentOrders ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-neutral-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{o.customer_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyle[o.status as OrderStatus]}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatXOF(o.total_xof)}</td>
                </tr>
              ))}
              {(recentOrders ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-neutral-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-neutral-800 p-5 transition-colors hover:border-neutral-600">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-medium tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-600">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
