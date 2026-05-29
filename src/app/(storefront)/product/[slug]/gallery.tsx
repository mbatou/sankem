"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ProductImageRow } from "@/lib/types/database";

type Img = ProductImageRow & { url: string };

export function Gallery({ images, viewTransitionId }: { images: Img[]; viewTransitionId: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return <div className="aspect-[3/4] w-full bg-ink-raised" aria-hidden />;
  }

  function scrollTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActive(idx);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setActive(idx);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-6">
      {/* Main / swipeable track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth lg:block lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative aspect-[3/4] w-full shrink-0 snap-start bg-ink-raised lg:mb-6 lg:aspect-[3/4]"
          >
            <Image
              src={img.url}
              alt={img.alt || ""}
              fill
              priority={i === 0}
              sizes="(min-width:1024px) 55vw, 100vw"
              className="object-cover"
              style={i === 0 ? { viewTransitionName: `product-${viewTransitionId}` } : undefined}
            />
          </div>
        ))}
      </div>

      {/* Thumbnails / dots */}
      {images.length > 1 && (
        <>
          <div className="hidden gap-3 lg:flex lg:w-20 lg:flex-col">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => scrollTo(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-[3/4] w-full overflow-hidden border ${
                  active === i ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2 lg:hidden">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => scrollTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  active === i ? "bg-gold" : "bg-paper/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
