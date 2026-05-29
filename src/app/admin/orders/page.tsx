import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "./orders-table";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status, total_xof, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl">Orders</h1>
      <OrdersTable orders={orders ?? []} />
    </div>
  );
}
