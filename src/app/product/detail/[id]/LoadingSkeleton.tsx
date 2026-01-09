export function ProductDetailSkeleton() {
  return (
    <div className="productdetail__container h-full pt-5 animate-pulse">
      <div className="product_section flex flex-row w-full h-fit max-smallest_tablet:flex-col max-smallest_tablet:items-center">
        {/* Image Gallery Skeleton */}
        <div className="w-full h-fit overflow-x-auto">
          <div className="w-full grid grid-cols-2 gap-3 max-small_screen:flex max-small_screen:flex-row max-small_screen:justify-start max-small_screen:items-center">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="w-[400px] h-[500px] bg-gray-300 rounded-lg max-medium_screen:w-[350px] max-medium_screen:h-[450px]"
              />
            ))}
          </div>
        </div>

        {/* Product Details Skeleton */}
        <div className="product_detail w-3/4 max-smallest_tablet:w-[95vw] max-smallest_tablet:pl-0 flex flex-col pl-4 gap-y-10 h-fit">
          {/* Product Name */}
          <div className="h-10 bg-gray-300 rounded-lg w-3/4"></div>

          {/* Description Lines */}
          <div className="flex flex-col gap-y-2">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            <div className="h-6 bg-gray-200 rounded w-4/5"></div>
          </div>

          {/* Price */}
          <div className="h-12 bg-gray-300 rounded-lg w-48"></div>

          {/* Other Versions */}
          <div className="flex flex-col gap-y-5">
            <div className="h-6 bg-gray-300 rounded w-40"></div>
            <div className="grid grid-cols-3 gap-y-5">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="w-[200px] h-[180px] bg-gray-200 rounded-lg border-2 border-gray-300"
                />
              ))}
            </div>
          </div>

          {/* Options Section (Size/Color/Quantity) */}
          <div className="flex flex-col gap-y-5">
            <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-16 bg-gray-300 rounded-lg w-full"></div>
          </div>

          {/* Toggle Menus (Product Detail, Policies) */}
          <div className="flex flex-col gap-y-2">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-12 bg-gray-200 rounded-lg w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="relatedproduct__section w-full h-full mt-10 flex flex-col gap-y-5">
        <div className="h-8 bg-gray-300 rounded w-64"></div>
        <div className="w-full h-fit flex flex-row overflow-x-auto gap-x-5">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="min-w-[250px] h-[350px] bg-gray-200 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductImageSkeleton() {
  return (
    <div className="w-[400px] h-[500px] bg-gray-300 rounded-lg animate-pulse max-medium_screen:w-[350px] max-medium_screen:h-[450px]"></div>
  );
}

export function RelatedProductSkeleton() {
  return (
    <div className="w-[200px] h-[180px] bg-gray-200 rounded-lg border-2 border-gray-300 animate-pulse flex flex-col gap-y-3 items-center justify-center p-2">
      <div className="w-[100px] h-[100px] bg-gray-300 rounded-lg"></div>
      <div className="w-full h-6 bg-gray-300 rounded"></div>
    </div>
  );
}

export function SimilarProductCardSkeleton() {
  return (
    <div className="min-w-[250px] h-[350px] bg-gray-200 rounded-lg shadow-md animate-pulse flex flex-col p-4 gap-y-3">
      <div className="w-full h-[200px] bg-gray-300 rounded-lg"></div>
      <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
      <div className="w-1/2 h-8 bg-gray-300 rounded"></div>
    </div>
  );
}
