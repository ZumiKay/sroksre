"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <svg
        className="w-24 h-24 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
      <p className="text-gray-600 text-center max-w-md">
        We couldn't load this product. It may have been removed or doesn't
        exist.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[#495464] text-white rounded-lg hover:bg-[#5a6575] transition-colors font-medium"
        >
          Try Again
        </button>
        <a
          href="/product"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Browse Products
        </a>
      </div>
    </div>
  );
}
