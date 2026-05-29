import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mark an order paid and decrement stock — idempotent. Safe to call from both
 * the success_url handler and the Wave webhook; only the first pending→paid
 * transition decrements stock.
 */
export async function settleOrderPaid(orderId: string): Promise<{ settled: boolean }> {
  const supabase = createAdminClient();

  // Atomic guard: only transition if currently pending.
  const { data: updated } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!updated) {
    // Already settled (or not pending) — nothing more to do.
    return { settled: false };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    if (!item.variant_id) continue;
    const { error } = await supabase.rpc("decrement_variant_stock", {
      p_variant_id: item.variant_id,
      p_qty: item.quantity,
    });
    if (error) {
      // Payment already captured — log oversell rather than failing settlement.
      console.error(`Stock decrement failed for variant ${item.variant_id}:`, error.message);
    }
  }

  return { settled: true };
}
