import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { BagDrawer } from "@/components/storefront/bag-drawer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <div id="main" className="flex-1">
        {children}
      </div>
      <Footer />
      <BagDrawer />
    </div>
  );
}
