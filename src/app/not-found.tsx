import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-editorial flex min-h-dvh flex-col items-center justify-center text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-paper/40">404</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-3 text-paper/60">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="btn-outline mt-8">
        Return home
      </Link>
    </main>
  );
}
