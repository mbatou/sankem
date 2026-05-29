import { requireAdmin } from "@/lib/auth";

// Full orders management is built in Phase 6.
export default async function OrdersPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-serif text-2xl">Orders</h1>
      <p className="mt-2 text-neutral-500">Orders management is coming in a later phase.</p>
    </div>
  );
}
