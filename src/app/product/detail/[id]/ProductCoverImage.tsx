"use client";
import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@heroui/react";

export function ProductCoverImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-100 h-125 max-medium_screen:w-87.5 max-medium_screen:h-112.5">
      {loading && <Skeleton className="absolute inset-0 rounded-lg" />}
      <Image
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        width={400}
        height={500}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={85}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
