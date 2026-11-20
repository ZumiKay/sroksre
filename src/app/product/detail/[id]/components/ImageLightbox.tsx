"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

const ZOOM = 2.5;
const TAP_SLOP = 6; // px a pointer may move and still count as a tap
const SWIPE_MIN = 50; // px a touch must travel to change image

const clamp = (n: number) => Math.min(100, Math.max(0, n));

interface ImageLightboxProps {
  images: Array<{ url: string }>;
  index: number;
  name: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Fullscreen viewer. Click/tap zooms in at that point and again zooms out.
 * While zoomed, the mouse pans by pointing and touch pans by dragging.
 * Unzoomed, swipe or arrow keys change image; Escape closes.
 */
export function ImageLightbox({
  images,
  index,
  name,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const count = images.length;
  const image = images[index];
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<{
    startX: number;
    lastX: number;
    lastY: number;
    moved: number;
  } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = (next: number) => {
    setZoomed(false);
    onIndexChange((next + count) % count);
  };

  // Lock page scroll and move focus into the dialog while it is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) setZoomed(false);
        else onClose();
      } else if (count > 1 && e.key === "ArrowRight") go(index + 1);
      else if (count > 1 && e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pointAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = {
      startX: e.clientX,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: 0,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    if (e.pointerType === "mouse") {
      setOrigin(pointAt(e));
      return;
    }
    const p = pointer.current;
    if (!p) return;
    const dx = e.clientX - p.lastX;
    const dy = e.clientY - p.lastY;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.moved += Math.abs(dx) + Math.abs(dy);
    if (p.moved > TAP_SLOP) setDragging(true);
    // Shift the zoom origin so the spot under the finger stays under it
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin((o) => ({
      x: clamp(o.x - ((dx / r.width) * 100) / (ZOOM - 1)),
      y: clamp(o.y - ((dy / r.height) * 100) / (ZOOM - 1)),
    }));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    pointer.current = null;
    setDragging(false);
    if (!p) return;

    const swipe = e.clientX - p.startX;
    if (!zoomed && e.pointerType !== "mouse" && count > 1 && Math.abs(swipe) > SWIPE_MIN) {
      go(swipe < 0 ? index + 1 : index - 1);
      return;
    }
    if (p.moved > TAP_SLOP || Math.abs(swipe) > TAP_SLOP) return;

    if (zoomed) {
      setZoomed(false);
    } else {
      setOrigin(pointAt(e));
      setZoomed(true);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} images`}
      className="fixed inset-0 z-1000 flex flex-col bg-black/95 text-white"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-white/80">
          {count > 1 ? `${index + 1} / ${count}` : ""}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 place-content-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1">
        <div
          className={`absolute inset-0 overflow-hidden select-none ${
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pointer.current = null;
            setDragging(false);
          }}
        >
          <Image
            key={image.url}
            src={image.url}
            alt={`${name} – image ${index + 1} of ${count}`}
            fill
            sizes="100vw"
            quality={90}
            draggable={false}
            className="object-contain"
            style={{
              transform: `scale(${zoomed ? ZOOM : 1})`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: dragging ? "none" : "transform 200ms ease-out",
            }}
          />
        </div>

        {count > 1 && !zoomed && (
          <>
            <LightboxArrow side="left" onClick={() => go(index - 1)} />
            <LightboxArrow side="right" onClick={() => go(index + 1)} />
          </>
        )}
      </div>

      <p className="py-3 text-center text-xs text-white/60">
        {zoomed ? "Tap to zoom out" : "Tap the image to zoom in"}
      </p>
    </div>,
    document.body,
  );
}

const LightboxArrow = ({
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
    } grid h-11 w-11 place-content-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white`}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-6 w-6">
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
