/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname;
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
} catch {
  supabaseHostname = undefined;
}

const nextConfig = {
  images: {
    // Supabase Storage public/render URLs live under the project hostname.
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/**" }]
        : []),
      // Allow any *.supabase.co bucket while the env var is not yet set locally.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
    ],
  },
  experimental: {
    // Wrap client-side route navigations in document.startViewTransition so the
    // ::view-transition CSS in globals.css (and product image morphs) take effect.
    viewTransition: true,
  },
};

export default nextConfig;
