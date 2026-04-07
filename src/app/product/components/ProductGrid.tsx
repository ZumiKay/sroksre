import { ProductState } from "@/src/types/product.type";
import Card from "../../component/Card";
import Link from "next/link";

interface ProductGridProps {
  products: ProductState[];
  categoryName?: string;
}

export const ProductGrid = ({ products, categoryName }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-6 py-24 px-4">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-gray-100 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h18M3 7l2 13h14L21 7M3 7l2-3h14l2 3M9 11v5M15 11v5"
              />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">
            {categoryName
              ? `No products in "${categoryName}"`
              : "No products found"}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            {categoryName
              ? `This category doesn't have any products yet. Check back later or explore other categories.`
              : `We couldn't find any products matching your criteria. Try adjusting your filters or browse other categories.`}
          </p>
        </div>

        <Link
          href="/product?all=1&p=1&show=10"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div
      className="listproduct grid 
        grid-cols-3 
        gap-x-5
        gap-y-32 
        place-content-center 
        w-fit h-full mb-10
        max-small_screen:grid-cols-1
        max-small_phone:p-1
        max-smallest_phone:gap-x-2
        max-smallest_phone:p-0"
    >
      {products.map((product, idx) => (
        <Card
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price.toString()}
          img={product.covers as any}
          index={idx}
          discount={product.discount as any}
          stock={product.stock || undefined}
          isAdmin={false}
        />
      ))}
    </div>
  );
};
