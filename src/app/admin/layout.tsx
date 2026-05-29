import Link from "next/link";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();

  // The login page renders without chrome (middleware allows it unauthenticated).
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg">
              {brand.name}
              <span className="ml-2 text-xs font-sans uppercase tracking-widest text-neutral-500">
                Admin
              </span>
            </Link>
            <nav className="hidden gap-4 text-sm text-neutral-400 sm:flex">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-neutral-500 md:inline">{user.email}</span>
            <form action={signOut}>
              <button className="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-4 border-t border-neutral-800 px-4 py-2 text-sm text-neutral-400 sm:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
