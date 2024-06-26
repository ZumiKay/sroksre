"use client";

import { useGlobalContext } from "@/src/context/GlobalContext";
import { notFound } from "next/navigation";

export default function Productlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { error } = useGlobalContext();
  return (
    <div className="w-screen min-h-screen">{error ? notFound() : children}</div>
  );
}
