import { brand } from "@/config/brand";

// Phase 1 placeholder home. The editorial storefront home is built in Phase 4.
export default function Page() {
  return (
    <main className="container-editorial flex min-h-dvh flex-col justify-center py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-paper/50">{brand.tagline}</p>
      <h1 className="mt-6 text-6xl leading-[0.95] sm:text-8xl">{brand.name}</h1>
      <p className="mt-8 max-w-md text-paper/70">{brand.statement}</p>
      <span className="mt-10 h-px w-24 bg-gold" aria-hidden />
    </main>
  );
}
