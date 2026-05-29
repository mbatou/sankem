"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { settleOrderPaid } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";

const allowed: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled"];

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  if (!allowed.includes(status)) {
    return { ok: false as const, error: "Invalid status" };
  }

  // Moving to "paid" goes through the idempotent settle path so stock is
  // decremented exactly once (same as the Wave success/webhook flow).
  if (status === "paid") {
    await settleOrderPaid(orderId);
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}
