import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutSession } from "@/lib/wave/client";
import { settleOrderPaid } from "@/lib/orders";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/");

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, wave_payment_ref")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) redirect("/");

  // Verify with Wave server-side — never trust the redirect alone.
  let confirmed = order.status === "paid";
  if (!confirmed && order.wave_payment_ref) {
    try {
      const session = await getCheckoutSession(order.wave_payment_ref);
      if (session.status === "paid") {
        await settleOrderPaid(order.id);
        confirmed = true;
      }
    } catch (err) {
      console.error("Wave verification error:", err);
    }
  }

  if (confirmed) {
    redirect(`/order/${order.order_number}`);
  }

  // Payment not yet confirmed — the webhook may still settle it out-of-band.
  return (
    <main className="container-editorial flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-3xl">Payment processing</h1>
      <p className="mt-3 max-w-md text-paper/60">
        We&apos;re confirming your payment for order{" "}
        <span className="text-gold">{order.order_number}</span>. This can take a moment — you can
        safely refresh this page.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href={`/checkout/success?order=${order.id}`} className="btn-outline">
          Refresh
        </Link>
        <Link href="/shop" className="btn-ghost">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
