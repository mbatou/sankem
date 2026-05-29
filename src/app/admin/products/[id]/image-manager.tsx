"use client";

import { useRef, useState, useTransition } from "react";
import NextImage from "next/image";
import {
  registerProductImage,
  deleteProductImage,
  reorderProductImages,
  updateImageAlt,
} from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_BUCKET } from "@/lib/images";
import type { ProductImageRow } from "@/lib/types/database";

type ImageWithUrl = ProductImageRow & { url: string };

export function ImageManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: ImageWithUrl[];
}) {
  const [images, setImages] = useState<ImageWithUrl[]>(initialImages);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed.");
          continue;
        }
        if (file.size > 25 * 1024 * 1024) {
          setError(`"${file.name}" is larger than 25 MB.`);
          continue;
        }

        // Upload the file straight to Supabase Storage (authenticated as the
        // admin; storage RLS allows the insert). Only the path goes to the
        // Server Action afterwards, so we never hit the request body limit.
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (upErr) {
          setError(upErr.message);
          continue;
        }

        const res = await registerProductImage(productId, path);
        if (res.ok && res.image) {
          setImages((prev) => [...prev, { ...res.image, url: urlFor(res.image.storage_path) }]);
        } else if (!res.ok) {
          // DB record failed — clean up the orphaned upload.
          await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
          setError(res.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function urlFor(path: string) {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET ?? "product-images";
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  function remove(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => deleteProductImage(id).then(() => undefined));
  }

  function commitOrder(next: ImageWithUrl[]) {
    setImages(next);
    startTransition(() =>
      reorderProductImages(
        productId,
        next.map((i) => i.id),
      ).then(() => undefined),
    );
  }

  function onDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    commitOrder(next);
  }

  return (
    <div>
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-colors ${
          dragOver ? "border-white bg-neutral-800" : "border-neutral-700 text-neutral-500"
        }`}
        onClick={() => fileInput.current?.click()}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? "Uploading…" : "Drag & drop images here, or click to browse"}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {/* Grid */}
      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, idx) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => (dragIndex.current = idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(idx)}
              className="group relative cursor-grab overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
            >
              <div className="relative aspect-square">
                {img.url && (
                  <NextImage
                    src={img.url}
                    alt={img.alt || ""}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                )}
                {idx === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-red-300 opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
              <input
                defaultValue={img.alt}
                placeholder="Alt text"
                onBlur={(e) => updateImageAlt(img.id, e.target.value)}
                className="w-full border-t border-neutral-800 bg-neutral-900 px-2 py-1 text-xs outline-none focus:bg-neutral-800"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
