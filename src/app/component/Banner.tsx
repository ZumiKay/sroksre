"use client";
import { CSSProperties } from "react";
import { Skeleton } from "@heroui/react";

export const NormalSkeleton = ({
  width,
  height,
  count,
  style,
}: {
  width: string;
  height: string;
  count: number;
  style?: CSSProperties;
}) => {
  return (
    <div style={style} className="w-full h-fit flex flex-col gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className="rounded-lg" style={{ height, width }} />
      ))}
    </div>
  );
};
