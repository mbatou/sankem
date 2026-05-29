import { NextResponse, type NextRequest } from "next/server";
import {
  WAVE_WEBHOOK_SIGNATURE_HEADER,
  verifyWebhookSignature,
  parseWebhookEvent,
} from "@/lib/wave/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { settleOrderPaid } from "@/lib/orders";

// Must read the raw body for signature verification — disable any caching.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get(WAVE_WEBHOOK_SIGNATURE_HEADER);

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { orderId, sessionId, status } = parseWebhookEvent(payload);

  // Only act on successful payments. Other events are acknowledged as no-ops.
  if (status !== "paid") {
    return NextResponse.json({ received: true });
  }

  // Resolve our order id: prefer the echoed client_reference, else look up by
  // the Wave session id we stored at creation.
  let resolvedOrderId = orderId;
  if (!resolvedOrderId && sessionId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("wave_payment_ref", sessionId)
      .maybeSingle();
    resolvedOrderId = data?.id ?? null;
  }

  if (!resolvedOrderId) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  await settleOrderPaid(resolvedOrderId);
  return NextResponse.json({ received: true });
}
