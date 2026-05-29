import "server-only";
import crypto from "node:crypto";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Wave Checkout Sessions API wrapper.
 * ─────────────────────────────────────────────────────────────────────────────
 * The flow and verification logic here are correct; the exact endpoint paths,
 * request/response field names, and the webhook signature scheme are left as
 * clearly-marked TODOs to confirm against Wave's docs. Search for `TODO(wave)`.
 *
 * Everything is server-only — the API key never reaches the client.
 */

const API_BASE = (process.env.WAVE_API_BASE_URL ?? "https://api.wave.com").replace(/\/$/, "");

function apiKey(): string {
  const key = process.env.WAVE_API_KEY;
  if (!key) throw new Error("WAVE_API_KEY is not set");
  return key;
}

export type WaveSession = {
  id: string;
  /** Hosted checkout URL the customer is redirected to. */
  checkoutUrl: string;
  /** Normalized status. */
  status: "pending" | "paid" | "failed" | "expired" | "unknown";
  raw: unknown;
};

// TODO(wave): confirm exact field name(s) Wave uses for payment status and the
// set of possible values. Adjust this mapping accordingly.
function normalizeStatus(raw: Record<string, unknown>): WaveSession["status"] {
  const s = String(
    raw.payment_status ?? raw.status ?? raw.checkout_status ?? "",
  ).toLowerCase();
  if (["succeeded", "success", "complete", "completed", "paid"].includes(s)) return "paid";
  if (["failed", "cancelled", "canceled", "error"].includes(s)) return "failed";
  if (["expired"].includes(s)) return "expired";
  if (["open", "pending", "processing", "created"].includes(s)) return "pending";
  return "unknown";
}

// TODO(wave): confirm the response shape — which field carries the session id
// and which carries the hosted checkout URL (e.g. `wave_launch_url`).
function extractSession(raw: Record<string, unknown>): { id: string; checkoutUrl: string } {
  const id = String(raw.id ?? raw.session_id ?? raw.checkout_session_id ?? "");
  const checkoutUrl = String(
    raw.wave_launch_url ?? raw.checkout_url ?? raw.launch_url ?? raw.url ?? "",
  );
  return { id, checkoutUrl };
}

/**
 * Create a Wave checkout session for an order.
 * @param amountXof  Integer FCFA amount (no decimals).
 */
export async function createCheckoutSession(params: {
  amountXof: number;
  successUrl: string;
  errorUrl: string;
  clientReference: string; // our order id, echoed back to us
}): Promise<WaveSession> {
  // TODO(wave): confirm endpoint path for creating a checkout session.
  const endpoint = `${API_BASE}/v1/checkout/sessions`;

  // TODO(wave): confirm the exact request body field names. XOF has no minor
  // unit, so the amount is sent as a whole-number string.
  const body = {
    amount: String(params.amountXof),
    currency: "XOF",
    success_url: params.successUrl,
    error_url: params.errorUrl,
    client_reference: params.clientReference,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Wave create session failed (${res.status}): ${detail}`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const { id, checkoutUrl } = extractSession(raw);
  if (!id || !checkoutUrl) {
    throw new Error("Wave create session: missing id or checkout URL in response");
  }
  return { id, checkoutUrl, status: normalizeStatus(raw), raw };
}

/**
 * Re-fetch a session's status from Wave. Used by the success_url handler — we
 * never trust the redirect alone.
 */
export async function getCheckoutSession(sessionId: string): Promise<WaveSession> {
  // TODO(wave): confirm endpoint path for retrieving a checkout session.
  const endpoint = `${API_BASE}/v1/checkout/sessions/${encodeURIComponent(sessionId)}`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey()}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Wave get session failed (${res.status}): ${detail}`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const { id, checkoutUrl } = extractSession(raw);
  return { id: id || sessionId, checkoutUrl, status: normalizeStatus(raw), raw };
}

/**
 * Verify an inbound webhook signature.
 *
 * TODO(wave): confirm the signature scheme. Common pattern (Stripe-style, which
 * Wave's webhooks resemble) is an HMAC-SHA256 over the raw request body keyed by
 * WAVE_WEBHOOK_SECRET, delivered in a header. Confirm:
 *   - the header name (set as WAVE_WEBHOOK_SIGNATURE_HEADER below),
 *   - whether a timestamp is prefixed into the signed payload,
 *   - the digest encoding (hex vs base64).
 */
export const WAVE_WEBHOOK_SIGNATURE_HEADER = "wave-signature"; // TODO(wave): confirm

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a configured secret we cannot trust the webhook.
    return false;
  }
  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  // Constant-time compare; tolerate a "sha256=" prefix or raw hex.
  const provided = signature.replace(/^sha256=/, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Pull our order id and a status out of a webhook payload. */
export function parseWebhookEvent(raw: Record<string, unknown>): {
  orderId: string | null;
  sessionId: string | null;
  status: WaveSession["status"];
} {
  // TODO(wave): confirm where the event nests its data and where our
  // client_reference (order id) is echoed back.
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const orderId =
    (data.client_reference as string | undefined) ??
    (data.reference as string | undefined) ??
    null;
  const sessionId =
    (data.id as string | undefined) ?? (data.session_id as string | undefined) ?? null;
  return { orderId, sessionId, status: normalizeStatus(data) };
}
