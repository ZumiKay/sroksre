"use client";

import Image from "next/image";
import { useState, KeyboardEvent } from "react";

interface ProductGalleryProps {
  images: Array<{ url: string }>;
  name: string;
}

/**
 * Main image with thumbnails. The whole photo is shown (object-contain) so
 * product shots aren't cropped; arrows/keys/thumbnails switch images.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
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

  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={count > 1 ? handleKeyDown : undefined}
        className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 outline-none focus-visible:ring-4 focus-visible:ring-gray-300"
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
