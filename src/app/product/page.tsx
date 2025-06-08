"use server";
import Link from "next/link";
import {
  GetBannerLink,
  getCate,
  GetListProduct,
  getSubCate,
  ListproductCateType,
} from "./action";
import { notFound } from "next/navigation";
import Card from "../component/Card";
import { PaginationSSR } from "../dashboard/order/OrderComponent";
import {
  ProductFilterButton,
  PromotionProductListContainer,
} from "./component";
import Prisma from "@/src/lib/prisma";
import { Banner } from "../component/HomePage/Component";
import { format } from "date-fns";
import { calculateDiscountPrice, IsNumber } from "@/src/lib/utilities";
import NotFound from "../not-found";
import type { Metadata } from "next";
import {
  BannerState,
  categorytype,
  ImageDatatype,
  ProductState,
  PromotionState,
  SubcategoriesState,
} from "@/src/context/GlobalType.type";
import { Parentcategories } from "@prisma/client";

interface ProductParam {
  p?: string;
  show?: string;
  pid?: string;
  cid?: string;
  filter?: string;
  color?: string;
  size?: string;
  other?: string;
  promo?: string;
  search?: string;
  promoid?: string;
  ppid?: string;
  pids?: string;
  bid?: string;
  all?: string;
  sort?: string;
  pcate?: string;
  ccate?: string;
}

export type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const searchParams = await props.searchParams;
  // read route params
  const param = searchParams as ProductParam;

  // fetch data
  let title = "SrokSre";
  let description = "";

  if (param.pid || param.cid) {
    let parent = "";
    let child = "";
    if (param.pid) {
      const pcate = await Prisma.parentcategories.findUnique({
        where: { id: parseInt(param.pid) },
        select: { name: true, description: true },
      });
      description = pcate?.description ?? "";
      parent = `${pcate?.name ?? ""} ${pcate?.description ?? ""}`;
    }
    if (param.cid) {
      const ccate = await Prisma.childcategories.findUnique({
        where: { id: parseInt(param.cid) },
        select: {
          name: true,
        },
      });
      child = ccate?.name ?? "";
    }
    title = `${parent} ${child}`;
  }

  // optionally access and extend (rather than replace) parent metadata

  return {
    title: title + ` | SrokSre`,
    description,
  };
}

const fetchPromotion = async (id: number) => {
  const promotion = await Prisma.promotion.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      banner: {
        select: {
          id: true,
          name: true,
          Image: true,
        },
      },
    },
  });

  const result = {
    ...promotion,
    banner: {
      ...promotion?.banner,
      image: promotion?.banner?.Image as unknown as {
        url: string;
        name: string;
      },
    },
  };

  return result;
};

const getAllPromotion = async () => {
  const promotions = await Prisma.promotion.findMany({
    where: { expireAt: { gte: new Date() } },
    select: {
      id: true,
      name: true,
      description: true,
      banner: {
        select: {
          id: true,
          name: true,
          Image: {
            select: {
              url: true,
              name: true,
            },
          },
        },
      },
      expireAt: true,
      createdAt: true,
      Products: {
        select: {
          id: true,
          name: true,
          price: true,
          covers: {
            select: {
              url: true,
              name: true,
            },
          },
          discount: true,
        },
      },
    },
  });

  const formatExpireAt = (date: Date) => {
    // Convert UTC date to PT
    const bkkDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
    return format(bkkDate, "M/dd 'at' hh:mm aaaa 'BKK'");
  };

  const formattedPromotions = promotions.map((promotion) => ({
    ...promotion,
    Products: promotion.Products.map((prod) => {
      if (prod.discount) {
        return {
          ...prod,
          discount: calculateDiscountPrice(prod.price, prod.discount),
        };
      }
      return prod;
    }),
    expireAt: `${formatExpireAt(promotion.createdAt)} to ${formatExpireAt(
      promotion.expireAt
    )}`,
  }));

  return formattedPromotions;
};

const isArrayWithEmptyStrings = (arr?: string[]): boolean => {
  if (!arr) return false;
  return arr.every((item) => item === "");
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Move data fetching to parallel promises
  const resolvedSearchParams = await searchParams;
  const {
    pid,
    cid,
    p = "1",
    show = "1",
    color,
    size,
    other,
    promo,
    search,
    promoid,
    ppid,
    pids,
    bid,
    all,
    sort,
    pcate,
    ccate,
  } = resolvedSearchParams as unknown as ProductParam;

  // Early return for empty search params
  if (
    resolvedSearchParams &&
    Object.entries(resolvedSearchParams).length === 0
  ) {
    return NotFound();
  }

  const isColor = color?.split(",");
  const isSize = size?.split(",");
  const isOther = other?.split(",");
  const isPromo = promo?.split(",");
  const isSelectProduct = pids?.split(",");
  const isParentCate = pcate?.split(",");
  const isChildCate = ccate?.split(",");
  const page = p;
  const limit = show;

  // Combine validations into single function call
  if (
    !validateParams({
      isColor,
      isSize,
      isOther,
      isPromo,
      isSelectProduct,
      p,
      limit,
      all,
      bid,
      search,
      promoid,
      ppid,
      pids,
      pid,
      cid,
      sort,
    })
  ) {
    return notFound();
  }

  // Parallel data fetching
  const [cateData, subcateData, promotionData, allpromotionData, bannerData] =
    await Promise.all([
      // Fetch category data if pid exists
      pid || ppid ? getCate(pid ?? ppid ?? "0", cid) : null,

      // Fetch subcategory if no pid but cid exists
      cid ? getSubCate(cid) : null,

      // Fetch promotion if promoid exists
      promoid ? fetchPromotion(parseInt(promoid)) : null,

      // Fetch all promotions if ppid exists
      ppid ? getAllPromotion() : null,

      // Fetch banner if bid exists
      bid ? GetBannerLink(parseInt(bid, 10)) : null,
    ]);

  // Handle category validation after parallel fetching
  const subcate = subcateData;
  let cate = cateData as ListproductCateType | null;

  if ((pid && !cate) || (!pid && cid && !subcate)) {
    return notFound();
  }

  // Handle promotion category if promoid exists
  if (promoid && !pid && !cate) {
    cate = (await Prisma.parentcategories.findFirst({
      where: { type: categorytype.sale },
      select: { id: true, name: true },
    })) as Parentcategories;
  }

  // Validate promotion exists if promoid was requested
  if (promoid && !promotionData) {
    return notFound();
  }

  // Fetch products only if needed (memoize/cache this fetch if possible)
  const allproduct = !ppid
    ? await GetListProduct(
        page,
        limit,
        pid ?? "0",
        cid,
        cate?.type === "latest",
        {
          color: isColor,
          size: isSize,
          other: isOther,
          promo: isPromo,
          parent_id: isParentCate,
          child_id: isChildCate,
          selectpids: isSelectProduct,
          search,
        },
        all,
        sort ? parseInt(sort) : undefined,
        promoid
      )
    : undefined;

  // Optimize rendering with memoized values
  const categoryName = getCategoryName(
    promotionData as unknown as PromotionState,
    bannerData as unknown as BannerState,
    cate,
    all
  );

  console.dir({ allpromotionData }, { depth: null });

  const banner = promotionData?.banner?.image && (
    <Banner
      data={{
        image: {
          url: promotionData.banner.image?.url ?? "",
          name: promotionData.banner.image?.name,
        },
        name: "",
      }}
      style={{ marginTop: "-5%" }}
    />
  );

  // Generate path links
  const pathLinks = generatePathLinks(
    subcate as unknown as SubcategoriesState,
    cate,
    promotionData as unknown as PromotionState,
    pid
  );

  return (
    <div className="products_page relative w-full min-h-[100vh] h-full flex flex-col justify-center items-center gap-y-20">
      <div className="header_section w-full h-fit flex flex-col items-start gap-y-5">
        {banner}
        <h2 className="category_name text-3xl w-fit font-normal text-black text-center pt-3 pl-5 italic">
          {categoryName}
        </h2>
        <div
          className="path_container h-full flex flex-row items-center 
          max-smallest_phone:flex max-smallest_phone:flex-col 
          gap-x-3 w-full pl-5 text-left text-lg font-light border-b-2 border-b-black p-2
          max-smallest_phone:items-start"
        >
          {pathLinks}
        </div>
        {(all || pid) && (
          <div className="filter_container w-full pr-2 pl-2 h-[40px] flex flex-row justify-center">
            <ProductFilterButton
              pid={pid ?? "0"}
              cid={cid}
              color={isColor}
              other={isOther}
              search={search}
              promo={isPromo}
              pcate={isParentCate}
              ccate={isChildCate}
              isPromotion={promoid}
              productcount={
                allproduct?.count
                  ? Math.ceil(allproduct.count * parseInt(limit))
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* 9. Conditionally render product list with improved layout */}
      {allproduct && allproduct.data ? (
        <ProductGrid products={allproduct.data} />
      ) : (
        allpromotionData && (
          <PromotionList
            promotions={allpromotionData as unknown as PromotionState[]}
          />
        )
      )}

      {/* 10. Conditionally render pagination */}
      {(!ppid || (allproduct && allproduct.data)) && (
        <PaginationSSR
          total={allproduct?.count ?? 0}
          pages={parseInt(page)}
          limit={limit}
        />
      )}
    </div>
  );
}

// Helper functions to keep the main component clean

// Extract product grid to a separate component
function ProductGrid({ products }: { products: ProductState[] }) {
  return (
    <div
      className="listproduct grid grid-cols-3 gap-x-5 gap-y-32 place-content-center 
      w-fit h-full mb-10 max-small_screen:grid-cols-1 max-small_phone:p-1
      max-smallest_phone:gap-x-2 max-smallest_phone:p-0"
    >
      {products?.map((product, idx) => (
        <Card
          key={product.id}
          name={product.name}
          price={product.price.toString()}
          img={product.covers}
          index={idx}
          discount={product.discount}
          stock={product.stock || undefined}
          id={product.id}
          isAdmin={false}
        />
      ))}
    </div>
  );
}

// Extract promotion list to a separate component
function PromotionList({ promotions }: { promotions: PromotionState[] }) {
  return (
    <>
      {promotions.map((promo) => (
        <PromotionProductListContainer
          key={promo.id}
          name={promo.name}
          description={promo.description ?? ""}
          expiredDate={promo.expireAt ?? ""}
          banner={promo.banner?.Image as ImageDatatype}
          product={promo.Products as ProductState[]}
        />
      ))}
    </>
  );
}

interface validateParamsType extends ProductParam {
  isColor?: string[];
  isSize?: string[];
  isOther?: string[];
  isPromo?: string[];
  isSelectProduct?: string[];
  limit: string;
}

// Validate parameters in a consolidated way
function validateParams({
  isColor,
  isSize,
  isOther,
  isPromo,
  isSelectProduct,
  p,
  limit,
  all,
  bid,
  search,
  promoid,
  ppid,
  pids,
  pid,
  cid,
  sort,
}: validateParamsType) {
  // Check for empty string arrays
  if (
    isArrayWithEmptyStrings(isColor) ||
    isArrayWithEmptyStrings(isSize) ||
    isArrayWithEmptyStrings(isOther) ||
    isArrayWithEmptyStrings(isPromo) ||
    isArrayWithEmptyStrings(isSelectProduct)
  ) {
    return false;
  }

  // Check for empty strings
  if (
    (p && p === "") ||
    (limit && limit === "") ||
    (all && all === "") ||
    (bid && bid === "") ||
    (search && search === "") ||
    (promoid && promoid === "") ||
    (ppid && ppid === "") ||
    (pids && pids === "") ||
    (pid && pid === "") ||
    (cid && cid === "") ||
    (sort && (sort === "" || parseInt(sort) > 2))
  ) {
    return false;
  }

  // Check numeric values
  if (
    !IsNumber(limit) ||
    (pid && !IsNumber(pid)) ||
    (cid && !IsNumber(cid)) ||
    (p && !IsNumber(p)) ||
    (promoid && !IsNumber(promoid)) ||
    (ppid && !IsNumber(ppid)) ||
    (bid && !IsNumber(bid)) ||
    (all && !IsNumber(all)) ||
    (sort && !IsNumber(sort))
  ) {
    return false;
  }

  return true;
}

// Get category name from available data
function getCategoryName(
  promotion: PromotionState,
  banner: BannerState,
  cate: ListproductCateType | null,
  all?: string
) {
  if (promotion) return promotion.name;
  if (banner) return banner.name;
  if (all) return "All Products";
  return (cate && (cate?.sub ? cate.sub.name : cate.name)) ?? "";
}

// Generate path links based on context
function generatePathLinks(
  subcate: SubcategoriesState,
  cate: ListproductCateType | null,
  promotion: PromotionState,
  pid?: string
) {
  return (
    <>
      <Link href={"/"}>
        <div className="transition hover:text-gray-300 cursor-pointer">
          Home
        </div>
      </Link>
      <div className="w-[3px] h-[25px] bg-black rotate-[190deg]"></div>

      {/* Category link */}
      {(cate || subcate) && (
        <Link
          href={`/product?${
            subcate
              ? subcate.Parentcategories?.type === "sale"
                ? `ppid=${subcate.Parentcategories.id}`
                : `pid=${subcate.Parentcategories?.id}`
              : cate?.type === "sale"
              ? `ppid=${cate.id}`
              : `pid=${pid}`
          }`}
        >
          <div className="transition hover:text-gray-300 cursor-pointer">
            {cate?.name ?? subcate?.Parentcategories?.name ?? ""}
          </div>
        </Link>
      )}

      {/* Subcategory link */}
      {(subcate || (cate && cate.sub) || promotion) && (
        <>
          <div className="w-[3px] h-[25px] bg-black rotate-[190deg]"></div>
          <Link
            href={`/product?pid=${
              subcate ? subcate.Parentcategories?.id : pid
            }&cid=${cate?.sub?.id}`}
          >
            <div className="transition hover:text-gray-300 cursor-pointer">
              {subcate
                ? subcate.name
                : promotion
                ? promotion.name
                : cate && cate.sub && cate.sub.name}
            </div>
          </Link>
        </>
      )}
    </>
  );
}
