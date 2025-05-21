import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../Modals";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { ProductState } from "@/src/context/GlobalType.type";
import { CircularProgress, Input } from "@heroui/react";
import { PrimaryPhoto } from "../PhotoComponent";
import { debounce } from "lodash";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";

const FetchPreviewProduct = async (offet: number, q?: string) => {
  const getReq = await ApiRequest({
    url: `/api/order/list?lt=${offet}${
      q ? `&q=${removeSpaceAndToLowerCase(q)}` : ""
    }`,
    method: "GET",
  });

  if (!getReq.success) {
    return null;
  }

  return getReq.data;
};

const PreviewProductCard = ({ product }: { product: ProductState }) => {
  const displayPrice = useCallback(() => {
    return product.discount ? (
      <p className="w-full h-fit flex flex-row items-center gap-x-3 font-normal">
        <span className="text-gray-300 decoration-red-400 line-through ">
          {product.price.toFixed(2)}
        </span>
        <span className="text-red-400">-{product.discount.percent}</span>
        <span className="text-black">{product.discount.newprice}</span>
      </p>
    ) : (
      <p className="text-lg font-normal">{product.price.toFixed(2)}</p>
    );
  }, [product.discount, product.price]);
  return (
    <div className="previewProductCard w-[300px] h-[220px]">
      <div className="w-full h-[150px[">
        <PrimaryPhoto data={product.covers} hover={true} showcount={false} />
      </div>

      <div className="productInfo w-full h-full">
        <p>{product.name}</p>
        {displayPrice()}
      </div>
    </div>
  );
};

const ProductPreviewModal = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(5);
  const [products, setProducts] = useState<Array<ProductState>>([]);
  const [search, setSearch] = useState<string>("");

  // Fetch products based on offset
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const getReq = await FetchPreviewProduct(offset);
        if (getReq) {
          setProducts(getReq as Array<ProductState>);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [offset]);

  // Debounced search effect
  useEffect(() => {
    async function searchProducts() {
      if (search.trim() === "") return;

      setLoading(true);
      try {
        // Assuming you have a search API function
        const searchResults = await FetchPreviewProduct(offset, search);
        if (searchResults) {
          setProducts(searchResults as Array<ProductState>);
        }
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setLoading(false);
      }
    }

    // Only search if there's actually a search term
    if (search.trim() !== "") {
      const handler = setTimeout(() => {
        searchProducts();
      }, 500); // 500ms debounce delay

      return () => clearTimeout(handler);
    }
  }, [search, offset]);

  const handleClose = useCallback(() => {
    setopenmodal({});
  }, [setopenmodal]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
    }, 500),
    []
  );

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + 5);
  }, []);

  return (
    <SecondaryModal
      open={openmodal?.showproducts ?? false}
      onPageChange={handleClose}
      size="2xl"
    >
      <div className="flex flex-col w-full h-full bg-white p-4 gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Product Preview
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative w-full mb-4">
          <Input
            type="text"
            placeholder="Search by name or category..."
            label="Search"
            size="sm"
            className="w-full"
            onChange={handleSearch}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <CircularProgress className="w-10 h-10 text-blue-500" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-96 p-1">
              {products.map((prod) => (
                <PreviewProductCard key={prod.id} product={prod} />
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
              >
                Load More
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </SecondaryModal>
  );
};
export default ProductPreviewModal;
