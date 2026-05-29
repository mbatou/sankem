"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/wave/client";
import { brand, getDeliveryZone } from "@/config/brand";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(120),
  customer_phone: z.string().min(6, "A valid phone number is required").max(32),
  customer_email: z.string().email().optional().or(z.literal("")),
  address_line: z.string().min(1, "Shipping address is required").max(300),
  city: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  zoneId: z.string().min(1, "Select a delivery zone"),
  items: z.array(itemSchema).min(1, "Your bag is empty"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; checkoutUrl: string; orderNumber: string }
  | { ok: false; error: string };

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SK-${stamp}-${rand}`;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid checkout details" };
  }
  const data = parsed.data;

  const zone = getDeliveryZone(data.zoneId);
  if (!zone) return { ok: false, error: "Invalid delivery zone" };

  const supabase = createAdminClient();

  // ── Re-price and validate every line server-side (never trust the client) ──
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const variantIds = data.items
    .map((i) => i.variantId)
    .filter((v): v is string => Boolean(v));

  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, base_price_xof, status")
      .in("id", productIds),
    variantIds.length
      ? supabase
          .from("product_variants")
          .select("id, product_id, name, price_override_xof, stock_qty")
          .in("id", variantIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  type Line = {
    product_id: string;
    variant_id: string | null;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price_xof: number;
    line_total_xof: number;
  };
  const lines: Line[] = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || product.status !== "active") {
      return { ok: false, error: "A product in your bag is no longer available." };
    }
    let unitPrice = product.base_price_xof;
    let variantName: string | null = null;

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.product_id !== item.productId) {
        return { ok: false, error: "A selected option is no longer available." };
      }
      // Block-at-zero: reject if requested quantity exceeds current stock.
      if (variant.stock_qty < item.quantity) {
        return {
          ok: false,
          error: `"${product.name} — ${variant.name}" only has ${variant.stock_qty} in stock.`,
        };
      }
      unitPrice = variant.price_override_xof ?? product.base_price_xof;
      variantName = variant.name;
    }

    lines.push({
      product_id: item.productId,
      variant_id: item.variantId,
      product_name: product.name,
      variant_name: variantName,
      quantity: item.quantity,
      unit_price_xof: unitPrice,
      line_total_xof: unitPrice * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.line_total_xof, 0);
  const shipping = zone.fee_xof;
  const total = subtotal + shipping;

  // ── Create the order (pending) ──────────────────────────────────────────-
  const orderNumber = generateOrderNumber();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      shipping_address: {
        address_line: data.address_line,
        city: data.city || null,
        notes: data.notes || null,
        zone_label: zone.label,
      },
      shipping_zone_id: zone.id,
      status: "pending",
      subtotal_xof: subtotal,
      shipping_xof: shipping,
      total_xof: total,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Could not create the order. Please try again." };
  }

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (itemsErr) {
    return { ok: false, error: "Could not save order items. Please try again." };
  }

  // ── Kick off Wave checkout ────────────────────────────────────────────────
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? brand.url).replace(/\/$/, "");
  try {
    const session = await createCheckoutSession({
      amountXof: total,
      successUrl: `${base}/checkout/success?order=${order.id}`,
      errorUrl: `${base}/checkout?error=1`,
      clientReference: order.id,
    });

    await supabase
      .from("orders")
      .update({ wave_payment_ref: session.id, wave_checkout_url: session.checkoutUrl })
      .eq("id", order.id);

    return { ok: true, checkoutUrl: session.checkoutUrl, orderNumber: order.order_number };
  } catch (err) {
    // Order stays pending; surface a friendly error.
    console.error("Wave checkout error:", err);
    return {
      ok: false,
      error: "Payment could not be started. Your order was saved as pending — please retry.",
    };
  }
}
