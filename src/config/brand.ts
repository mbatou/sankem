/**
 * Brand & theme configuration.
 *
 * This is the single place to swap in the real identity: brand name, logo,
 * palette hex values, tagline, and delivery zones. Values here are consumed
 * by Tailwind (see tailwind.config.ts), the layout metadata, and checkout.
 *
 * NOTE: The palette below is mirrored in tailwind.config.ts. If you change a
 * hex value here, update it there too (Tailwind needs literal values at build
 * time and cannot import this TS module).
 */

export const brand = {
  /** Brand display name — used in titles, header, OG metadata. */
  name: "SANKEM",
  /** Short tagline / brand statement for the home page. */
  tagline: "Quiet luxury, made to be worn.",
  statement:
    "An edited wardrobe of considered pieces. Designed in restraint, finished with intent — clothing meant to outlast the season.",
  /** Path (in /public) or remote URL to the logo. Placeholder for now. */
  logo: {
    // Drop a real asset in /public and point here, or leave null to render
    // the wordmark in the display serif.
    src: null as string | null,
    width: 160,
    height: 40,
  },
  /** Canonical site URL — used for metadata, sitemap, OG, Wave callbacks. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  social: {
    instagram: "https://instagram.com/",
    email: "hello@example.com",
  },
} as const;

/**
 * Palette — keep in sync with tailwind.config.ts.
 * Minimal luxury: near-black, off-white, a single restrained gold.
 */
export const palette = {
  ink: "#0A0A0A", // near-black background
  paper: "#F5F5F0", // off-white text
  gold: "#C9A24B", // restrained gold accent
  goldMuted: "#9A7B38",
  hairline: "rgba(245,245,240,0.12)",
} as const;

export const currency = {
  code: "XOF",
  label: "FCFA",
} as const;

/**
 * Delivery zones. Customer selects one at checkout; the fee is added to the
 * subtotal to form the order total. Edit freely — ids are stored on the order
 * (within the shipping_address JSON) for reference.
 */
export type DeliveryZone = {
  id: string;
  label: string;
  fee_xof: number;
};

export const deliveryZones: DeliveryZone[] = [
  { id: "dakar-plateau", label: "Dakar — Plateau / Centre", fee_xof: 2000 },
  { id: "dakar-banlieue", label: "Dakar — Banlieue", fee_xof: 3000 },
  { id: "thies", label: "Thiès", fee_xof: 4000 },
  { id: "regions", label: "Autres régions", fee_xof: 6000 },
];

export function getDeliveryZone(id: string | null | undefined): DeliveryZone | undefined {
  if (!id) return undefined;
  return deliveryZones.find((z) => z.id === id);
}
