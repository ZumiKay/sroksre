import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../Modals";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
} from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { Chip, CircularProgress, Input } from "@heroui/react";
import { PrimaryPhoto } from "../PhotoComponent";
import { debounce } from "lodash";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { Productordertype } from "@/src/context/OrderContext";

const fetchPreviewProduct = async (
  offset: number,
  orderId: string,
  query?: string
) => {
  try {
    const response = await ApiRequest({
      url: `/api/order/list?ty=product&lt=${offset}&id=${orderId}${
        query ? `&q=${removeSpaceAndToLowerCase(query)}` : ""
      }`,
      method: "GET",
    });

    return response.success ? response.data : null;
  } catch (error) {
    console.error("Error fetching preview products:", error);
    return null;
  }
};

const PreviewProductCard = memo(
  ({ orderproduct }: { orderproduct: Productordertype }) => {
    const { product, quantity, details, total } = orderproduct;

    const displayPrice = useMemo(() => {
      if (!product) return null;

      return product.discount ? (
        <div className="flex items-center gap-3 font-normal">
          <span className="text-gray-400 line-through">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-red-500 text-sm">
            -{product.discount.percent}%
          </span>
          <span className="text-gray-900 font-medium">
            ${product.discount.newprice}
          </span>
        </div>
      ) : (
        <span className="text-lg font-medium text-gray-900">
          ${product.price.toFixed(2)}
        </span>
      );
    }, [product]);

    const selectedOptions = useMemo(() => {
      if (!details?.length) return null;

      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Options:</p>
          <div className="flex flex-wrap gap-2">
            {details.map((selected) => {
              const selectedValue =
                selected.variant?.option_value[selected.variantIdx];

              if (!selectedValue) return null;

              return typeof selectedValue === "string" ? (
                <Chip
                  key={selected.variantId}
                  size="sm"
                  variant="flat"
                  color="primary"
                >
                  {selectedValue}
                </Chip>
              ) : (
                <div
                  key={selected.variantId}
                  className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-md"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedValue.val }}
                  />
                  <span className="text-sm text-gray-700">
                    {selectedValue.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }, [details]);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {product && (
          <div className="w-full h-32 mb-3 overflow-hidden rounded-md">
            <PrimaryPhoto
              data={product.covers}
              hover={true}
              showcount={false}
            />
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {product?.name}
          </h3>

          {selectedOptions}

          <div className="flex items-center justify-between">
            {displayPrice}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Chip size="lg" variant="solid">
              Qty: {quantity}
            </Chip>
            <Chip size="lg" variant="solid" className="bg-black text-white">
              Total: ${(total ?? 0).toFixed(2)}
            </Chip>
          </div>
        </div>
      </div>
    );
  }
);

PreviewProductCard.displayName = "PreviewProductCard";

const ProductPreviewModal = () => {
  const { openmodal, setopenmodal, globalindex } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(5);
  const [products, setProducts] = useState<Productordertype[]>([]);
  const [query, setQuery] = useState("");

  // Single debounced search function
  const debouncedSearch = useCallback(
    debounce((newQuery: string) => {
      setQuery(newQuery);
      setOffset(5); // Reset pagination
    }, 300),
    []
  );

  const fetchProducts = useCallback(
    async (currentOffset: number, searchQuery?: string) => {
      const orderId = globalindex.orderId;
      if (!orderId) return;

      setLoading(true);
      try {
        const data = (await fetchPreviewProduct(
          currentOffset,
          orderId,
          searchQuery
        )) as Productordertype[];
        if (data) {
          setProducts((prev) =>
            currentOffset === 5 ? data : [...prev, ...data]
          );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [globalindex.orderId]
  );

  // Combined effect for fetch
  useEffect(() => {
    fetchProducts(offset, query);
  }, [fetchProducts, offset, query]);

  const handleClose = useCallback(() => {
    setopenmodal({});
    // Cleanup on close
    setProducts([]);
    setQuery("");
    setOffset(5);
  }, [setopenmodal]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const clearSearch = useCallback(() => {
    debouncedSearch("");
  }, [debouncedSearch]);

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + 5);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const hasProducts = products.length > 0;
  const showLoadMore = hasProducts && !query && !loading;

  return (
    <SecondaryModal
      open={!!openmodal.showproduct}
      onPageChange={handleClose}
      size="2xl"
    >
      <div className="flex flex-col h-full bg-white min-h-[50vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Product Preview
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search products..."
            label="Search"
            size="md"
            className="w-full"
            onChange={handleSearchChange}
            endContent={
              query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )
            }
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {loading && offset === 5 ? (
            <div className="flex justify-center items-center h-32">
              <CircularProgress size="lg" />
            </div>
          ) : hasProducts ? (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
                {products.map((orderproduct, idx) => (
                  <PreviewProductCard key={idx} orderproduct={orderproduct} />
                ))}
              </div>

              {showLoadMore && (
                <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No products found
              </h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};

export default ProductPreviewModal;
