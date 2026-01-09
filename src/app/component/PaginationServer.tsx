import Link from "next/link";
import { SelectionServerSide } from "./SelectionServerSide";

interface PaginationServerProps {
  total: number;
  currentPage: number;
  pageSize: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}

/**
 * Optimized Server-Side Pagination Component for Next.js 14
 *
 * Benefits:
 * - No client-side JavaScript for basic pagination
 * - SEO-friendly with proper links
 * - Fast navigation with Link prefetching
 * - Preserves all query parameters
 */
export function PaginationServer({
  total,
  currentPage,
  pageSize,
  baseUrl,
  searchParams = {},
}: PaginationServerProps) {
  const totalPages = Math.ceil(total / pageSize);

  // Generate page range with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and adjacent pages
      if (currentPage <= 3) {
        // Near start
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // Middle
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  const buildUrl = (page: number, show?: number) => {
    const params = new URLSearchParams();

    // Preserve existing params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "p" && key !== "show") {
        params.set(key, value);
      }
    });

    // Set pagination params
    params.set("p", page.toString());
    params.set("show", (show || pageSize).toString());

    return `${baseUrl}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const pages = getPageNumbers();

  return (
    <div className="w-full h-fit mt-[10%] flex flex-col gap-5 items-center">
      {/* Page Numbers */}
      <nav className="flex items-center gap-2" aria-label="Pagination">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
            scroll={false}
          >
            Previous
          </Link>
        ) : (
          <span className="px-4 py-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed font-medium">
            Previous
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-3 py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Link
                key={pageNum}
                href={buildUrl(pageNum)}
                className={`
                  min-w-[40px] px-3 py-2 rounded-md text-center font-medium transition-colors
                  ${
                    isActive
                      ? "bg-[#495464] text-white font-bold"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }
                `}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
            scroll={false}
          >
            Next
          </Link>
        ) : (
          <span className="px-4 py-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed font-medium">
            Next
          </span>
        )}
      </nav>

      {/* Items Per Page Selector */}
      <SelectionServerSide
        currentValue={pageSize}
        options={[1, 5, 10, 20, 30, 40, 50]}
        baseUrl={baseUrl}
        searchParams={searchParams}
        currentPage={currentPage}
      />

      {/* Page Info */}
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages} ({total} total items)
      </p>
    </div>
  );
}
