import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/lib/actions/products";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="max-w-lg">
      <Link href="/admin/products" className="text-sm text-neutral-400 hover:text-white">
        ← Products
      </Link>
      <h1 className="mt-2 font-serif text-2xl">New product</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Create a draft, then add description, images, variants and categories.
      </p>
      <form action={createProduct} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-neutral-400">Name</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>
        <label className="text-sm">
          <span className="text-neutral-400">Base price (FCFA)</span>
          <input
            name="base_price_xof"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>
        <button className="rounded bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200">
          Create draft
        </button>
      </form>
    </div>
  );
}
