import { ProductState } from "@/src/types/product.type";
import Card from "../../component/Card";

interface Product {
  id: number;
  name: string;
  price: number;
  covers: { url: string; name: string }[];
  discount?: number;
  stock?: number | null;
}

interface ProductGridProps {
  products: ProductState[];
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-gray-500">
        No products found
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
