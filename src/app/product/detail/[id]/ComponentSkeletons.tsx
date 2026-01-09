import { Skeleton } from "@nextui-org/react";

export function OptionSectionSkeleton() {
  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      {/* Error message placeholder */}
      <div className="h-7 w-full"></div>

      {/* Options skeleton */}
      <div className="w-full h-fit overflow-x-hidden overflow-y-auto flex flex-col gap-y-5 pl-2">
        {/* Variant option */}
        <div className="w-full h-fit flex flex-col gap-y-5">
          <Skeleton className="w-24 h-6 rounded-lg" />
          <div className="flex flex-row gap-3">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="w-16 h-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="flex flex-col gap-y-3">
          <Skeleton className="w-24 h-6 rounded-lg" />
          <Skeleton className="w-[200px] h-[50px] rounded-lg" />
        </div>
      </div>

      {/* Buttons skeleton */}
      <div className="product_action w-full pt-2 flex flex-col items-center gap-y-2">
        <Skeleton className="w-full h-[50px] rounded-lg" />
        <Skeleton className="w-full h-[50px] rounded-lg" />
      </div>
    </div>
  );
}

export function VariantOptionSkeleton() {
  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      <Skeleton className="w-32 h-6 rounded-lg" />
      <div className="flex flex-row gap-3">
        {[...Array(5)].map((_, idx) => (
          <Skeleton key={idx} className="w-20 h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function QuantitySelectorSkeleton() {
  return (
    <div className="flex flex-col gap-y-3">
      <Skeleton className="w-24 h-6 rounded-lg" />
      <Skeleton className="w-[200px] h-[50px] rounded-lg" />
      <div className="h-7"></div>
    </div>
  );
}
