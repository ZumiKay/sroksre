interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BuildBreadcrumbsParams {
  cate?: {
    id: number;
    name: string;
    type?: string | null;
    sub?: {
      id: number;
      name: string;
    } | null;
  } | null;
  subcate?: {
    id: number;
    name: string;
    Parentcategories?: {
      id: number;
      name: string;
      type?: string | null;
    } | null;
  } | null;
  promotion?: {
    id: number;
    name: string;
  } | null;
  isAll?: boolean;
  pid?: string;
  cid?: string;
}

/**
 * Build breadcrumb navigation items based on current page context
 */
export const buildBreadcrumbs = ({
  cate,
  subcate,
  promotion,
  isAll,
  pid,
  cid,
}: BuildBreadcrumbsParams): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: isAll ? "Home All" : "Home",
      href: "/",
    },
  ];

  // Add parent category
  if (subcate?.Parentcategories) {
    const isPromotion = subcate.Parentcategories.type === "sale";
    breadcrumbs.push({
      label: subcate.Parentcategories.name,
      href: isPromotion
        ? `/product?ppid=${subcate.Parentcategories.id}`
        : `/product?pid=${subcate.Parentcategories.id}`,
    });
  } else if (cate) {
    const isPromotion = cate.type === "sale";
    breadcrumbs.push({
      label: cate.name,
      href: isPromotion ? `/product?ppid=${cate.id}` : `/product?pid=${pid}`,
    });
  }

  // Add child category or promotion
  if (subcate) {
    breadcrumbs.push({
      label: subcate.name,
      href: `/product?pid=${subcate.Parentcategories?.id}&cid=${cid}`,
    });
  } else if (cate?.sub) {
    breadcrumbs.push({
      label: cate.sub.name,
      href: `/product?pid=${pid}&cid=${cid}`,
    });
  } else if (promotion) {
    breadcrumbs.push({
      label: promotion.name,
      href: `/product?pid=${pid}&cid=${cid}`,
    });
  }

  return breadcrumbs;
};
