import { Metadata } from "next";
import { fetchContainers, formatContainer } from "./api/home/route";
import { Suspense } from "react";
import {
  HomeErrorBoundary,
  HomeContainerSkeleton,
} from "./component/HomePage/ErrorBoundary";
import { ContainerRenderer } from "./component/HomePage/ContainerRenderer";

//  Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SrokSre Online Store. Quality Over Quantity",
    description: "Small Online Store Base in Phnompenh Cambodia",
    openGraph: {
      title: "SrokSre Online Store",
      description: "Small Online Store Base in Phnompenh Cambodia",
      type: "website",
    },
  };
}

const fetchhomeitems = async () => {
  try {
    const data = await fetchContainers("detail");
    const res = data.map((i) => formatContainer(i as any));
    return res;
  } catch (error) {
    console.error("Failed to fetch home items:", error);
    return [];
  }
};

async function HomeContent() {
  const items = await fetchhomeitems();

  if (!items || items.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4 p-8">
        <svg
          className="w-20 h-20 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-600">
          No Content Available
        </h2>
        <p className="text-gray-500 text-center max-w-md">
          We're setting up the store. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[95vw] h-full flex flex-col items-center gap-y-5">
      {items.map((container, idx) => (
        <ContainerRenderer key={idx} container={container as never} idx={idx} />
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <main className="Home__Container w-full h-full grid place-content-center gap-y-10 min-h-screen relative">
      <HomeErrorBoundary>
        <Suspense fallback={<HomeContainerSkeleton />}>
          <HomeContent />
        </Suspense>
      </HomeErrorBoundary>
    </main>
  );
}
