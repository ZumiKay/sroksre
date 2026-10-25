"use server";
import { notFound } from "next/navigation";
import { GetProductDetailById } from "./detail_action";
import {
  ButtonForSimilarProd,
  OptionSection,
  ShowPrice,
  ShowPriceWithOptions,
} from "./Component";
import Link from "next/link";
import ToggleMenu from "@/src/app/component/ToggleMenu";
import { getRelatedProduct } from "./action";
import Card from "@/src/app/component/Card";
import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import {
  RelatedProductSkeleton,
  SimilarProductCardSkeleton,
} from "./LoadingSkeleton";
import { ProductCoverImage } from "./ProductCoverImage";
import { Relatedproducttype } from "@/src/types/product.type";
import { Orderpricetype } from "@/src/types/order.type";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idString } = await params;
  const id = parseInt(idString);

  const product = await Prisma.products.findUnique({
    where: { id },
    select: {
      name: true,
      parentcateogries: {
        select: {
          name: true,
        },
      },
      childcategories: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!product) return { title: "" };
  const title = product.name ?? "" + `| SrokSre`;
  const description = `${product.name} ${
    product.parentcateogries?.name ?? ""
  } ${product.childcategories?.name ?? ""} at SrokSre online store`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

interface SearchParamType {
  lt?: string;
}
export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await getUser();
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  const searchparam = (await searchParams) as SearchParamType;

  const { success, data } = await GetProductDetailById(id);

  if (!success || !data?.data) {
    return notFound();
  }

  return (
    <div className="productdetail__container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="product_section flex flex-col lg:flex-row w-full gap-8 lg:gap-12 items-start">
        <div className="w-full lg:w-1/2 overflow-hidden">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:pb-4 scrollbar-hide">
            {data?.data.covers.map((img, idx) => (
              <ProductCoverImage
                key={idx}
                src={img.url}
                alt={`${data.data.name} - Image ${idx + 1}`}
                priority={idx === 0}
              />
            ))}
          </div>
        </div>
        <div className="product_detail w-full lg:w-1/2 flex flex-col gap-y-6 sm:gap-y-8">
          <h3 className="product_name text-2xl sm:text-3xl font-bold h-fit pt-1 wrap-break-word">
            {data?.data.name}
          </h3>
          <p className="product_description text-lg font-normal w-full">
            {data?.data.description ?? "No Description"}
          </p>
          {data?.data.Variant && data?.data.Variant.length > 0 ? (
            <ShowPriceWithOptions
              price={data?.data.price ?? 0}
              discount={data?.data.discount}
              Variant={data?.data.Variant}
            />
          ) : (
            <ShowPrice
              price={data?.data.price ?? 0}
              discount={data?.data.discount}
            />
          )}

          {data?.data.relatedproduct && data.data.relatedproduct.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Other Version</h3>
              <Suspense
                fallback={
                  <div className="w-full h-fit grid grid-cols-3 gap-y-5">
                    {[...Array(3)].map((_, idx) => (
                      <RelatedProductSkeleton key={idx} />
                    ))}
                  </div>
                }
              >
                <ShowRelated data={data.data.relatedproduct} />
              </Suspense>
            </>
          )}

          <div className="w-full h-fit flex flex-col gap-y-5">
            <OptionSection
              data={data.data}
              isAdmin={user?.role === "ADMIN"}
              isInWishlist={
                data.isInWishlist ? data.isInWishlist.isExist : false
              }
              isInCart={data.incart}
            />
          </div>

          <div className="w-full h-full flex flex-col justify-start gap-y-2 ">
            <ToggleMenu
              name="Product Detail"
              isAdmin={false}
              data={data?.data.details.filter((i) => i.info_type !== "SIZE")}
            />

            {data?.policy.map((pol) => (
              <ToggleMenu
                key={pol.id}
                name={pol.title}
                isAdmin={false}
                paragraph={pol.Paragraph}
              />
            ))}
          </div>
        </div>
      </div>
      {data.data.relatedproduct && (
        <div className="relatedproduct__section w-full h-full mt-10 flex flex-col gap-y-10">
          <Suspense
            fallback={
              <div className="flex flex-col gap-y-5">
                <div className="h-8 bg-gray-300 rounded-sm w-64 animate-pulse"></div>
                <div className="w-full h-fit flex flex-row overflow-x-auto gap-x-5">
                  {[...Array(3)].map((_, idx) => (
                    <SimilarProductCardSkeleton key={idx} />
                  ))}
                </div>
              </div>
            }
          >
            <ShowSimilarProduct
              pid={id}
              parent_id={data?.data.category.parent_id ?? 0}
              child_id={data?.data.category.child_id}
              promoid={data?.data.promotion_id}
              limit={searchparam.lt ? parseInt(searchparam.lt) : undefined}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

const ShowRelated = ({ data }: { data: Relatedproducttype[] }) => {
  return (
    <div className="w-full h-fit grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {data.map((related) => (
        <Link key={related.id} href={`/product/detail/${related.id}`}>
          <div className="w-full h-fit flex flex-col gap-y-2 items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 hover:bg-black hover:text-white cursor-pointer group">
            <Image
              src={related.covers[0].url}
              alt={related.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
              width={100}
              height={100}
              loading="lazy"
              quality={75}
            />
            <h3 className="w-full text-center text-xs sm:text-sm font-medium line-clamp-2">{related.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
};

const ShowSimilarProduct = async ({
  pid,
  parent_id,
  child_id,
  promoid,
  limit = 3,
}: {
  pid: string;
  parent_id: number;
  child_id?: number;
  promoid?: number;
  limit?: number;
}) => {
  let relatedproduct = null;
  let isLimit = true;
  const data = await getRelatedProduct(
    parseInt(pid, 10),
    parent_id,
    limit,
    child_id,
    promoid,
  );

  if (data.success) {
    relatedproduct = data.data;
    data.maxprod && (isLimit = data.maxprod);
  }

  return (
    data.data &&
    data.data.length > 0 && (
      <>
        <h3 className="text-lg font-bold w-full h-fit text-left pl-2">
          You might also like:
        </h3>

        <div className="w-full h-fit flex flex-row overflow-x-auto gap-x-5">
          {relatedproduct?.map((prod, idx) => (
            <Card
              key={idx}
              name={prod.name}
              price={prod.price.toFixed(2)}
              img={prod.covers}
              index={idx}
              discount={prod.discount as Orderpricetype}
              id={prod.id}
            />
          ))}
        </div>

        {!isLimit && <ButtonForSimilarProd lt={limit} />}
      </>
    )
  );
};
