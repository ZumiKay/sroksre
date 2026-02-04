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
    <div className="header_section w-full h-fit flex flex-col items-start gap-y-5">
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

      <h2 className="category_name text-3xl w-fit font-normal text-black text-center pt-3 pl-5 italic">
        {title}
      </h2>

      <div className="path_container h-full flex flex-row items-center max-smallest_phone:flex max-smallest_phone:flex-col gap-x-3 w-full pl-5 text-left text-lg font-light border-b-2 border-b-black p-2 max-smallest_phone:items-start">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex flex-row items-center gap-x-3">
            {index > 0 && (
              <div className="w-[3px] h-[25px] bg-black rotate-[190deg]"></div>
            )}
            <Link href={item.href}>
              <div className="transition hover:text-gray-300 cursor-pointer">
                {item.label}
              </div>
            </Link>
          </div>
        ))}
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
