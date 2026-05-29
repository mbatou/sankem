"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/types/database";

// Sensible forward transitions; "cancelled" available unless already fulfilled.
const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

const labels: Record<OrderStatus, string> = {
  pending: "Mark pending",
  paid: "Mark paid",
  fulfilled: "Mark fulfilled",
  cancelled: "Cancel order",
};

export function OrderStatusControls({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = nextStatuses[current];

  function go(status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (options.length === 0) {
    return <p className="text-sm text-neutral-500">No further actions for a {current} order.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((s) => (
        <button
          key={s}
          onClick={() => go(s)}
          disabled={isPending}
          className={`rounded px-3 py-2 text-sm font-medium disabled:opacity-50 ${
            s === "cancelled"
              ? "border border-red-800 text-red-300 hover:bg-red-950"
              : "bg-white text-neutral-900 hover:bg-neutral-200"
          }`}
        >
          {labels[s]}
        </button>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
