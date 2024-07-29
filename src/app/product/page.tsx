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
import { getDiscountedPrice } from "@/src/lib/utilities";
import { cache } from "react";

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
}
export const revalidate = 3600;

const fetchPromotion = cache(async (id: number, page: number, show: number) => {
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
          covers: true,
        },
        skip: skip,
        take: show,
      },
    },
  });

  let result = {
    ...promotion,

    banner: {
      ...promotion?.banner,
      image: promotion?.banner?.image as unknown as {
        url: string;
        name: string;
      },
    },
  };

  return result;
});

const getAllPromotion = cache(async () => {
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
});

export function IsNumber(str: string) {
  // Check if the input is a string and not empty
  if (typeof str !== "string" || str.trim() === "") {
    return false;
  }

  // Use parseFloat to convert the string to a number
  const num = parseFloat(str);

  // Check if the parsed number is not NaN and is finite
  return !isNaN(num) && isFinite(num);
}
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
  } = searchParams as unknown as ProductParam;

  const isColor = color?.split(",");
  const isSize = size?.split(",");
  const isOther = other?.split(",");
  const isPromo = promo?.split(",");
  const isSelectProduct = pids?.split(",");
  const page = p ?? "1";
  const limit = show ?? "1";

  if (
    !IsNumber(limit) ||
    (pid && !IsNumber(pid)) ||
    (cid ? !IsNumber(cid) : false) ||
    !IsNumber(page) ||
    (promo && !IsNumber(promo)) ||
    (promoid && !IsNumber(promoid)) ||
    (ppid && !IsNumber(ppid)) ||
    (bid && !IsNumber(bid))
  ) {
    return notFound();
  }

  const cate = await getCate(pid ?? ppid ?? "0", cid);

  if (!cate) {
    return notFound();
  }

  const promotion =
    promoid &&
    (await fetchPromotion(parseInt(promoid), parseInt(page), parseInt(limit)));

  const allpromotion = ppid && (await getAllPromotion());
  const allproduct =
    !ppid &&
    (await GetListProduct(page, limit, pid ?? "0", cid, {
      color: isColor,
      size: isSize,
      other: isOther,
      promo: isPromo,
      selectpids: isSelectProduct,
      search,
    }));

  if (allproduct && !allproduct.success) {
    throw Error(allproduct.error);
  }
  if (promoid && !promotion) {
    return notFound();
  }

  console.log(cate);

  const banner = bid && (await GetBannerLink(parseInt(bid, 10)));

  return (
    <div className="products_page relative w-full min-h-[100vh] h-full flex flex-col gap-y-10">
      <div className="header_section w-full h-fit flex flex-col items-start gap-y-5">
        {promotion && promotion.banner && (
          <Banner
            data={{
              image: {
                url: promotion.banner.image.url,
                name: promotion.banner.image.name,
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
              : (cate && (cate.sub ? cate.sub.name : cate.name)) ?? ""
          }`}
        </h2>
        <div className="path_container flex flex-row items-center gap-x-3 w-full pl-5 text-left text-lg font-light border-b-2 border-b-black p-2">
          <Link href={"/"}>
            <div className="transition hover:text-gray-300 cursor-pointer">
              Home /
            </div>
          </Link>
          <Link
            href={`/product?${
              cate.type === "sale" ? `ppid=${pid}` : `pid=${pid}`
            }&page=1$limit=1`}
          >
            <div className="transition hover:text-gray-300 cursor-pointer">
              {`${cate.name ? `${cate.name} /` : ""}`}
            </div>
          </Link>
          {((cate && cate.sub) || promotion) && (
            <Link href={`/product?pid=${pid}&cid=${cid}&page=1&limit=1`}>
              {" "}
              <div className="transition hover:text-gray-300 cursor-pointer">
                {promotion ? promotion.name : cate && cate.sub && cate.sub.name}{" "}
                /
              </div>{" "}
            </Link>
          )}
        </div>
        {pid && (
          <div className="filter_container  min-w-[350px] h-[40px] mt-3 pl-5 flex flex-row gap-x-3 items-center ">
            {/* sort selection */}
            <ProductFilterButton
              pid={pid ?? "0"}
              cid={cid}
              color={isColor}
              size={isSize}
              other={isOther}
              search={search}
              isPromotion={!!promoid}
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

      {allproduct && allproduct?.data ? (
        <div className="listproduct grid grid-cols-3 w-full h-full place-content-center mt-5 p-3">
          {allproduct.data?.map((i, idx) => (
            <Card
              key={idx}
              name={i.name}
              price={i.price.toString()}
              img={i.covers}
              index={idx}
              discount={i.discount}
              stock={i.stock}
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
