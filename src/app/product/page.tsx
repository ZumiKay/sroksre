"use server";

import { notFound } from "next/navigation";
import { PaginationSSR } from "../dashboard/order/OrderComponent";
import {
  ProductFilterButton,
  PromotionProductListContainer,
} from "./component";
import NotFound from "../not-found";
import type { Metadata } from "next";
import {
  ProductParam,
  parseSearchParams,
  validateSearchParams,
  getPageTitle,
} from "./utils";
import {
  fetchPromotion,
  getAllPromotions,
  fetchCategoryData,
  fetchSaleCategory,
  fetchBanner,
  fetchCategoryMetadata,
  generateProductListSchema,
  generateBreadcrumbSchema,
} from "./data-fetching";
import { GetListProduct } from "./action";
import { PageHeader } from "./components/PageHeader";
import { ProductGrid } from "./components/ProductGrid";
import { buildBreadcrumbs } from "./breadcrumb-utils";
import { ProductState } from "@/src/types/product.type";

export type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const param = resolvedSearchParams as ProductParam;
  return await fetchCategoryMetadata(
    param.pid,
    param.cid,
    param.promoid,
    param.search,
    param.all,
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams as unknown as ProductParam;

  // Early validation
  if (
    !resolvedSearchParams ||
    Object.entries(resolvedSearchParams).length === 0
  ) {
    return NotFound();
  }

  if (!validateSearchParams(params)) {
    return notFound();
  }

  // Parse parameters
  const parsed = parseSearchParams(params);

  /**
   * pid = parent category and productId
   * cid = child category
   * ppid = promotion category id
   * bid = bannerId
   */
  const { pid, cid, promoid, ppid, bid, all, sort, search } = params;

  // Fetch category data
  const { cate, subcate } = await fetchCategoryData(pid, cid, ppid);

  if ((pid && !cate) || (!pid && cid && !subcate)) {
    return notFound();
  }

  // Handle promotion category
  let categoryData = cate;
  if (promoid && !pid) {
    categoryData = await fetchSaleCategory();
  }

  // Fetch data based on page type
  const promotion = promoid
    ? await fetchPromotion(
        parseInt(promoid),
        parseInt(parsed.page),
        parseInt(parsed.limit),
      )
    : undefined;

  const allPromotions = ppid ? await getAllPromotions() : undefined;

  //Get products based on searchParams
  const productList = !ppid
    ? await GetListProduct(
        parsed.page,
        parsed.limit,
        pid ?? "0",
        cid,
        categoryData?.type === "latest",
        {
          color: parsed.color,
          size: parsed.size,
          other: parsed.other,
          promo: parsed.promo,
          parent_id: parsed.parentCate,
          child_id: parsed.childCate,
          selectpids: parsed.selectProduct,
          search,
        },
        all,
        sort ? parseInt(sort) : undefined,
        promoid,
      )
    : undefined;

  if (promoid && !promotion) {
    return notFound();
  }

  const banner = bid ? await fetchBanner(parseInt(bid, 10)) : undefined;

  // Build page data
  const pageTitle = getPageTitle(
    categoryData?.name,
    categoryData?.sub?.name ?? subcate?.name,
    promotion?.name,
    banner?.name,
    Boolean(all),
  );

  const breadcrumbs = buildBreadcrumbs({
    cate: categoryData,
    subcate,
    promotion,
    isAll: Boolean(all),
    pid,
    cid,
  });

  const bannerImage = promotion?.banner?.image
    ? {
        url: promotion.banner.image.url,
        name: promotion.banner.image.name,
      }
    : undefined;

  // Generate structured data for SEO
  const productListSchema =
    productList?.data && productList.data.length > 0
      ? await generateProductListSchema(productList.data, pageTitle)
      : null;

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <div className="products_page relative w-full min-h-[100vh] h-full flex flex-col justify-center items-center gap-y-20">
      {/* JSON-LD Structured Data for SEO */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {productListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productListSchema),
          }}
        />
      )}

      <PageHeader
        title={pageTitle}
        breadcrumbs={breadcrumbs}
        bannerImage={bannerImage}
      />

      {(all || pid) && (
        <div className="filter_container w-full pr-2 pl-2 h-[40px] flex flex-row justify-center">
          <div className="w-full h-[40px] flex flex-row items-center gap-x-5">
            {(() => {
              return (
                <ProductFilterButton
                  pid={pid ?? "0"}
                  cid={cid}
                  color={parsed.color}
                  other={parsed.other}
                  search={search}
                  promo={parsed.promo}
                  pcate={parsed.parentCate}
                  ccate={parsed.childCate}
                  isPromotion={promoid}
                  productcount={
                    productList?.count
                      ? Math.ceil(productList.count * parseInt(parsed.limit))
                      : undefined
                  }
                />
              );
            })()}
          </div>
        </div>
      )}

      {productList ? (
        <ProductGrid products={productList.data ?? []} />
      ) : (
        allPromotions?.map((promo) => (
          <PromotionProductListContainer
            key={promo.id}
            name={promo.name}
            description={promo.description ?? ""}
            expiredDate={promo.expireAt ?? ""}
            banner={promo.banner?.image as any}
            product={promo.Products as any}
          />
        ))
      )}

      {(!ppid || (productList && productList.data)) && (
        <PaginationSSR
          total={productList?.count ?? 0}
          pages={parseInt(parsed.page)}
          limit={parsed.limit}
        />
      )}
    </div>
  );
}
