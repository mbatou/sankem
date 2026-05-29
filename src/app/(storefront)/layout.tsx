import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { BagDrawer } from "@/components/storefront/bag-drawer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <BagDrawer />
    </div>
  );
}
