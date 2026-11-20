"use client";

import Image from "next/image";
import { useState, KeyboardEvent, PointerEvent, MouseEvent } from "react";
import { ImageLightbox } from "./ImageLightbox";

const HOVER_ZOOM = 2;

interface ProductGalleryProps {
  images: Array<{ url: string }>;
  name: string;
}

/**
 * Main image with thumbnails. The whole photo is shown (object-contain) so
 * product shots aren't cropped; arrows/keys/thumbnails switch images.
 * Hovering with a mouse magnifies the spot under the cursor; clicking or
 * tapping opens a fullscreen viewer with tap-to-zoom.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  // Cursor position in % while hover-zooming (mouse only), else null
  const [hoverZoom, setHoverZoom] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const count = images.length;

  if (count === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-gray-100 grid place-content-center text-sm text-gray-400">
        No image
      </div>
    );
  }

  const index = Math.min(current, count - 1);
  const image = images[index];
  const go = (next: number) => setCurrent((next + count) % count);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };

  const isOnButton = (target: EventTarget) =>
    (target as HTMLElement).closest("button") !== null;

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || isOnButton(e.target)) {
      setHoverZoom(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setHoverZoom({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isOnButton(e.target)) return;
    setHoverZoom(null);
    setLightboxOpen(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={count > 1 ? handleKeyDown : undefined}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverZoom(null)}
        onClick={handleClick}
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-gray-50 outline-none focus-visible:ring-4 focus-visible:ring-gray-300"
      >
        {!loaded.has(image.url) && (
          <div className="absolute inset-0 animate-pulse bg-gray-100" />
        )}
        <Image
          key={image.url}
          src={image.url}
          alt={`${name} – image ${index + 1} of ${count}`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={index === 0}
          quality={85}
          onLoad={() =>
            setLoaded((prev) => new Set(prev).add(image.url))
          }
          className={`object-contain transition-opacity duration-300 ${
            loaded.has(image.url) ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Magnified copy, loaded at higher resolution only while hovering */}
        {hoverZoom && loaded.has(image.url) && (
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gray-50">
            <Image
              src={image.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 100vw, 200vw"
              quality={90}
              className="object-contain"
              style={{
                transform: `scale(${HOVER_ZOOM})`,
                transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%`,
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Zoom image"
          className="absolute right-3 top-3 grid h-10 w-10 place-content-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
            <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
            <path
              fillRule="evenodd"
              d="M2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm7-5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {count > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(index - 1)} />
            <GalleryArrow side="right" onClick={() => go(index + 1)} />
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={index}
          name={name}
          onIndexChange={setCurrent}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-current={idx === index}
              className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 border-2 transition-colors ${
                idx === index
                  ? "border-gray-900"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const GalleryArrow = ({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={side === "left" ? "Previous image" : "Next image"}
    className={`absolute top-1/2 -translate-y-1/2 ${
      side === "left" ? "left-3" : "right-3"
    } grid h-10 w-10 place-content-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100`}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
      <path
        fillRule="evenodd"
        d={
          side === "left"
            ? "M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            : "M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        }
        clipRule="evenodd"
      />
    </svg>
  </button>
);
