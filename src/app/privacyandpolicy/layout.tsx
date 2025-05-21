import { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  // Get referrer URL from headers
  const headersList = await headers(); // Remove 'await' - headers() is not async
  const referer = headersList.get("referer");

  // Initialize default metadata
  const metadata: Metadata = {
    title: "Policy Page | SrokSre",
    description: "View our company policies and guidelines",
    openGraph: {
      title: "Policy Page",
      description: "View our company policies and guidelines",
      type: "website",
      url: referer ?? "",
    },
  };

  // If we have a referrer URL, try to extract parameters and customize metadata

  return metadata;
}

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="policy-layout">
      {/* Layout components like header, navigation, etc. */}
      <main>{children}</main>
      {/* Footer or other layout elements */}
    </div>
  );
}
