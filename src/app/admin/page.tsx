import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

// Stats are added in Phase 6. This keeps the admin landing usable meanwhile.
export default async function AdminDashboard() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-serif text-2xl">Dashboard</h1>
      <p className="mt-2 text-neutral-400">Manage your catalog and orders.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-lg border border-neutral-800 p-5 hover:border-neutral-600"
        >
          <div className="font-medium">Products</div>
          <p className="mt-1 text-sm text-neutral-500">Create and edit products, images, variants.</p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-neutral-800 p-5 hover:border-neutral-600"
        >
          <div className="font-medium">Orders</div>
          <p className="mt-1 text-sm text-neutral-500">View orders and advance their status.</p>
        </Link>
      </div>
    </div>
  );
}
