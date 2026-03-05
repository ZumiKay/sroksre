"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationCustom from "@/src/app/component/Pagination_Component";
import { errorToast } from "@/src/app/component/Loading";
import useCheckSession from "@/src/hooks/useCheckSession";

interface PaginationSSRProps {
  total: number;
  pages?: number;
  limit?: string;
}

export const PaginationSSR = ({ total, pages, limit }: PaginationSSRProps) => {
  const [page, setpage] = useState(pages ?? 1);
  const [show, setshow] = useState(limit ?? "1");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCheckSession } = useCheckSession();

  useEffect(() => {
    setpage(pages ?? 1);
    setshow(limit ?? "1");
    setIsLoading(false);
  }, [pages, limit]);

  const handleSelectPage = async (value: number | string) => {
    setIsLoading(true);
    const isValid = await handleCheckSession();
    if (!isValid) {
      errorToast("Can't Verify Session", {
        toastId: "OrderManagementPagination",
      });
      setIsLoading(false);
      return;
    }

    const searchparam = new URLSearchParams(searchParams);
    searchparam.set("p", "1");
    searchparam.set("show", `${value}`);
    setpage(1);
    router.push(`?${searchparam}`, { scroll: false });
  };

  const handlePageChange = () => {
    setIsLoading(true);
  };

  return (
    <div className="w-full h-fit mt-[10%] relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg min-h-24">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600" />
            <p className="text-sm text-gray-700 font-medium">
              Loading orders...
            </p>
          </div>
        </div>
      )}
      <PaginationCustom
        page={page}
        show={show}
        setpage={setpage}
        setshow={setshow}
        count={total}
        onSelectShowPerPage={handleSelectPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
