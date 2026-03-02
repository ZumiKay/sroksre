"use client";
import React, { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PrimaryButton from "@/src/app/component/Button";

interface ButtonForSimilarProdProps {
  lt: number;
}

export const ButtonForSimilarProd = React.memo(
  ({ lt }: ButtonForSimilarProdProps) => {
    const router = useRouter();
    const searchParam = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleLoadMore = useCallback(() => {
      startTransition(() => {
        const param = new URLSearchParams(searchParam);
        param.set("lt", `${lt + 3}`);
        router.push(`?${param}`, { scroll: false });
        router.refresh();
      });
    }, [lt, searchParam, router]);

    return (
      <div className="w-full h-fit flex justify-center">
        <PrimaryButton
          type="button"
          text={isPending ? "Loading..." : "Load more"}
          radius="10px"
          width="20%"
          height="40px"
          disable={isPending}
          style={{ marginTop: "100px" }}
          onClick={handleLoadMore}
          status={isPending ? "loading" : "authenticated"}
        />
      </div>
    );
  },
);

ButtonForSimilarProd.displayName = "ButtonForSimilarProd";
