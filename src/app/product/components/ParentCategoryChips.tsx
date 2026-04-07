import Link from "next/link";

interface ParentCategoryChipItem {
  id: number;
  name: string;
}

interface ParentCategoryChipsProps {
  categories: ParentCategoryChipItem[];
  activePid?: string;
  isAllActive?: boolean;
}

export const ParentCategoryChips = ({
  categories,
  activePid,
  isAllActive,
}: ParentCategoryChipsProps) => {
  return (
    <div className="w-full px-4 md:px-6">
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max py-1">
          <Link
            href="/product?all=1"
            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isAllActive
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black"
            }`}
          >
            All categories
          </Link>

          {categories
            .filter(
              (category) => Number.isFinite(category.id) && !!category.name,
            )
            .map((category) => {
              const isActive = activePid === category.id.toString();
              const href = `/product?pid=${category.id}`;

              return (
                <Link
                  key={category.id}
                  href={href}
                  className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
};
