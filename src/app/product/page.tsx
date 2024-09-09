"use server";
import Link from "next/link";
import { GetBannerLink, getCate, GetListProduct } from "./action";
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
import { getDiscountedPrice, IsNumber } from "@/src/lib/utilities";
import NotFound from "../not-found";
import type { Metadata } from "next";

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
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
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
    appleWebApp: true,
  };
}

const fetchPromotion = async (id: number, page: number, show: number) => {
  const skip = (page - 1) * show;
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
          image: true,
        },
      },
      Products: {
        select: {
          id: true,
          name: true,
          price: true,
          discount: true,
          covers: { select: { name: true, url: true } },
          stock: true,
        },
        skip: skip,
        take: show,
      },
    },
  });

  let result = {
    ...promotion,
    Products: promotion?.Products.map((prod) => {
      if (prod.discount) {
        const discount = getDiscountedPrice(prod.discount, prod.price);

        return {
          ...prod,
          discount: { ...discount, newprice: discount.newprice.toFixed(2) },
        };
      }
      return prod;
    }),

    banner: {
      ...promotion?.banner,
      image: promotion?.banner?.image as unknown as {
        url: string;
        name: string;
      },
    },
  };

  return result;
};

const getAllPromotion = async () => {
  const promotions = await Prisma.promotion.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      banner: true,
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
        const discount = getDiscountedPrice(prod.discount, prod.price);

        return {
          ...prod,
          discount: { ...discount, newprice: discount.newprice.toFixed(2) },
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
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const {
    pid,
    cid,
    p,
    show,
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
  } = searchParams as unknown as ProductParam;

  const isColor = color?.split(",");
  const isSize = size?.split(",");
  const isOther = other?.split(",");
  const isPromo = promo?.split(",");
  const isSelectProduct = pids?.split(",");
  const isParentCate = pcate?.split(",");
  const isChildCate = ccate?.split(",");
  const page = p ?? "1";
  const limit = show ?? "1";

  if (searchParams && Object.entries(searchParams).length === 0) {
    return NotFound();
  }

  //Verify all search Params///
  if (
    isArrayWithEmptyStrings(isColor) ||
    isArrayWithEmptyStrings(isSize) ||
    isArrayWithEmptyStrings(isOther) ||
    isArrayWithEmptyStrings(isPromo) ||
    isArrayWithEmptyStrings(isSelectProduct) ||
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
    return notFound();
  }
  if (
    !IsNumber(limit) ||
    (pid && !IsNumber(pid)) ||
    (cid && !IsNumber(cid)) ||
    !IsNumber(page) ||
    (promoid && !IsNumber(promoid)) ||
    (ppid && !IsNumber(ppid)) ||
    (bid && !IsNumber(bid)) ||
    (all && !IsNumber(all)) ||
    (sort && !IsNumber(sort))
  ) {
    return notFound();
  }

  const cate = await getCate(pid ?? ppid ?? "0", cid);

  if (!cate) {
    return notFound();
  }

  ///////////

  const promotion = promoid
    ? await fetchPromotion(parseInt(promoid), parseInt(page), parseInt(limit))
    : undefined;

  const allpromotion = ppid && (await getAllPromotion());

  const allproduct =
    (!ppid &&
      (await GetListProduct(
        page,
        limit,
        pid ?? "0",
        cid,
        cate.type === "latest",
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
      ))) ||
    undefined;

  if (allproduct && !allproduct.success) {
    throw Error(allproduct.error);
  }
  if (promoid && !promotion) {
    return notFound();
  }

  const banner = bid && (await GetBannerLink(parseInt(bid, 10)));

  return (
    <div className="products_page relative w-full min-h-[100vh] h-full flex flex-col justify-center items-center gap-y-20">
      <div className="header_section w-full h-fit flex flex-col items-start gap-y-5">
        {promotion && promotion.banner && (
          <Banner
            data={{
              image: {
                url: promotion.banner.image?.url ?? "",
                name: promotion.banner.image?.name,
              },
              name: "",
            }}
            style={{ marginTop: "-5%" }}
          />
        )}
        <h2 className="category_name text-3xl w-fit font-normal text-black text-center pt-3 pl-5 italic">
          {`${
            promotion
              ? promotion.name
              : banner
              ? banner.name
              : all
              ? "All Products"
              : (cate && (cate.sub ? cate.sub.name : cate.name)) ?? ""
          }`}
        </h2>
        <div
          className="path_container h-full flex flex-row items-center 
        max-smallest_phone:flex max-smallest_phone:flex-col 
        gap-x-3 w-full pl-5 text-left text-lg font-light border-b-2 border-b-black p-2
        max-smallest_phone:items-start
        "
        >
          <Link href={"/"}>
            <div className="transition hover:text-gray-300 cursor-pointer">
              Home {all ? "All" : ""}
            </div>
          </Link>
          <div className="w-[3px] h-[25px] bg-black rotate-[190deg]"></div>
          <Link
            href={`/product?${
              cate.type === "sale" ? `ppid=${cate.id}` : `pid=${pid}`
            }&page=1$limit=1`}
          >
            <div className="transition hover:text-gray-300 cursor-pointer">
              {`${cate.name ? `${cate.name}` : ""}`}
            </div>
          </Link>
          <div
            hidden={!cate.sub || !promotion}
            className="w-[3px] h-[25px] bg-black rotate-[190deg]"
          ></div>

          {((cate && cate.sub) || promotion) && (
            <Link href={`/product?pid=${pid}&cid=${cid}&page=1&limit=1`}>
              <div className="transition hover:text-gray-300 cursor-pointer">
                {promotion ? promotion.name : cate && cate.sub && cate.sub.name}{" "}
              </div>
            </Link>
          )}
        </div>
        {(all || pid) && (
          <div className="filter_container  w-full pr-2 pl-2 h-[40px] flex flex-row justify-center">
            {/* sort selection */}
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
                allproduct && allproduct.count
                  ? Math.ceil(allproduct.count * parseInt(limit))
                  : undefined
              }
            />
            {/* Filter button */}
          </div>
        )}
      </div>

      {allproduct ? (
        <div
          className="listproduct grid 
        grid-cols-3 
        gap-x-5
        gap-y-32 
        place-content-center 
        w-fit h-full mb-10
        max-small_screen:grid-cols-2
        max-small_phone:p-1
        max-smallest_phone:gap-x-2
        max-smallest_phone:p-0
        
        "
        >
          {allproduct.data?.map((i, idx) => (
            <Card
              key={idx}
              name={i.name}
              price={i.price.toString()}
              img={i.covers as any}
              index={idx}
              discount={i.discount as any}
              stock={i.stock || undefined}
              id={i.id}
              isAdmin={false}
            />
          ))}
        </div>
      ) : (
        allpromotion &&
        allpromotion.map((promo) => (
          <PromotionProductListContainer
            key={promo.id}
            name={promo.name}
            description={promo.description ?? ""}
            expiredDate={promo.expireAt}
            banner={promo.banner?.image as any}
            product={promo.Products as any}
          />
        ))
      )}
      {(!ppid || (allproduct && allproduct.data)) && (
        <PaginationSSR
          total={allproduct ? allproduct.count ?? 0 : 0}
          pages={parseInt(page)}
          limit={limit}
        />
      )}
    </div>
  );
}
