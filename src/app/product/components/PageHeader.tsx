import Link from "next/link";
import { Banner } from "../../component/HomePage/Component";
import { ProductFilterButton } from "../component";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  bannerImage?: {
    url: string;
    name: string;
  };
}

export const PageHeader = ({
  title,
  breadcrumbs,
  bannerImage,
}: PageHeaderProps) => {
  return (
    <div className="header_section w-full h-fit flex flex-col items-start gap-y-2">
      {bannerImage && (
        <Banner
          data={{
            image: {
              url: bannerImage.url,
              name: bannerImage.name,
            },
            name: "",
          }}
          style={{ marginTop: "-5%" }}
        />
      )}

      <div className="w-full px-6 pt-2 pb-4 space-y-3">
        <nav aria-label="breadcrumb">
          <ol className="flex flex-row flex-wrap items-center gap-1 text-sm text-gray-400">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                <Link
                  href={item.href}
                  className={`transition-colors hover:text-black ${
                    index === breadcrumbs.length - 1
                      ? "text-gray-900 font-medium pointer-events-none"
                      : "hover:underline"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <h2 className="category_name text-4xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>

        <div className="w-16 h-1 bg-black rounded-full" />
      </div>
    </div>
  );
};

interface FilterSectionProps {
  showFilter: boolean;
  pid?: string;
  cid?: string;
  color?: string[];
  other?: string[];
  search?: string;
  promo?: string[];
  pcate?: string[];
  ccate?: string[];
  promoid?: string;
  productCount?: number;
}

export const FilterSection = ({ showFilter, ...props }: FilterSectionProps) => {
  if (!showFilter) return null;

  // Import the component dynamically to avoid circular dependency

  return (
    <div className="filter_container w-full pr-2 pl-2 h-[40px] flex flex-row justify-center">
      <ProductFilterButton
        pid={props.pid ?? "0"}
        cid={props.cid}
        color={props.color}
        other={props.other}
        search={props.search}
        promo={props.promo}
        pcate={props.pcate}
        ccate={props.ccate}
        isPromotion={props.promoid}
        productcount={props.productCount}
      />
    </div>
  );
};
