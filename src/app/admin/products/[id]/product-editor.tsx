"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import {
  updateProduct,
  setProductCategories,
  duplicateProduct,
  setProductStatus,
} from "@/lib/actions/products";
import type {
  ProductRow,
  ProductImageRow,
  ProductVariantRow,
  CategoryRow,
  ProductStatus,
} from "@/lib/types/database";
import { ImageManager } from "./image-manager";
import { VariantsEditor } from "./variants-editor";

type ImageWithUrl = ProductImageRow & { url: string };

export function ProductEditor({
  product,
  images,
  variants,
  categories,
  assignedCategoryIds,
}: {
  product: ProductRow;
  images: ImageWithUrl[];
  variants: ProductVariantRow[];
  categories: CategoryRow[];
  assignedCategoryIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(true);
  const [description, setDescription] = useState(product.description);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [price, setPrice] = useState(product.base_price_xof);
  const [featured, setFeatured] = useState(product.featured);
  const [catIds, setCatIds] = useState<string[]>(assignedCategoryIds);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function saveDetails() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("slug", slug);
      fd.set("description", description);
      fd.set("status", status);
      fd.set("base_price_xof", String(price));
      fd.set("featured", featured ? "true" : "false");
      const res = await updateProduct(product.id, fd);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error });
        return;
      }
      await setProductCategories(product.id, catIds);
      setSlug(res.slug);
      setMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl">{name || "Untitled"}</h1>
        <div className="flex items-center gap-2 text-sm">
          {status !== "active" && (
            <button
              onClick={() =>
                startTransition(async () => {
                  await setProductStatus(product.id, "active");
                  setStatus("active");
                  router.refresh();
                })
              }
              className="rounded border border-emerald-700 px-3 py-1.5 text-emerald-400 hover:bg-emerald-950"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => startTransition(() => duplicateProduct(product.id))}
            className="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800"
          >
            Duplicate
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column: details */}
        <div className="flex flex-col gap-5">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Slug" hint="Used in the product URL.">
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={`${inputCls} resize-y`}
            />
          </Field>

          <section className="rounded-lg border border-neutral-800 p-4">
            <h2 className="text-sm font-medium text-neutral-300">Images</h2>
            <p className="mb-3 text-xs text-neutral-500">
              Drag to reorder. The first image is the cover.
            </p>
            <ImageManager productId={product.id} initialImages={images} />
          </section>

          <section className="rounded-lg border border-neutral-800 p-4">
            <h2 className="text-sm font-medium text-neutral-300">Variants</h2>
            <p className="mb-3 text-xs text-neutral-500">
              Size / colour combinations with their own stock. Leave price override blank to use the
              base price.
            </p>
            <VariantsEditor productId={product.id} initialVariants={variants} />
          </section>
        </div>

        {/* Right column: status, price, featured, categories */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-lg border border-neutral-800 p-4">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <div className="mt-4">
              <Field label="Base price (FCFA)">
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              Featured on home
            </label>
          </div>

          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm font-medium text-neutral-300">Categories</h2>
            <div className="flex flex-col gap-1.5">
              {categories.length === 0 && (
                <p className="text-xs text-neutral-500">No categories yet.</p>
              )}
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={catIds.includes(c.id)}
                    onChange={(e) =>
                      setCatIds((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                      )
                    }
                    className="h-4 w-4 accent-white"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="sticky bottom-4 flex flex-col gap-2">
            {msg && (
              <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </p>
            )}
            <button
              onClick={saveDetails}
              disabled={isPending}
              className="rounded bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save details"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-neutral-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-600">{hint}</span>}
    </label>
  );
}
