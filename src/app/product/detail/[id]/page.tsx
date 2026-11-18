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
import { ProductGallery } from "./components/ProductGallery";
import { ProductInfoSections } from "./components/ProductInfoSections";
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
  // The root layout's title template appends the store name
  const title = product.name;
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

  const product = data.data;

  return (
    <div className="productdetail__container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="product_section grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery stays in view while the details column scrolls */}
        <div className="w-full lg:sticky lg:top-24">
          <ProductGallery images={product.covers} name={product.name} />
        </div>

        <div className="product_detail flex w-full min-w-0 flex-col gap-y-6">
          <div className="flex flex-col gap-y-3">
            <h1 className="product_name text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl wrap-break-word">
              {product.name}
            </h1>
            {product.Variant && product.Variant.length > 0 ? (
              <ShowPriceWithOptions
                price={product.price ?? 0}
                discount={product.discount}
                Variant={product.Variant}
              />
            ) : (
              <ShowPrice
                price={product.price ?? 0}
                discount={product.discount}
              />
            )}
          </div>

          {product.relatedproduct && product.relatedproduct.length > 0 && (
            <div className="flex flex-col gap-y-3">
              <p className="text-sm font-semibold text-gray-900">
                Other versions
              </p>
              <Suspense
                fallback={
                  <div className="w-full h-fit grid grid-cols-3 gap-y-5">
                    {[...Array(3)].map((_, idx) => (
                      <RelatedProductSkeleton key={idx} />
                    ))}
                  </div>
                }
              >
                <ShowRelated data={product.relatedproduct} />
              </Suspense>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <OptionSection
              data={product}
              isAdmin={user?.role === "ADMIN"}
              isInWishlist={
                data.isInWishlist ? data.isInWishlist.isExist : false
              }
              isInCart={data.incart}
            />
          </div>

          <ProductInfoSections
            description={product.description}
            details={product.details.filter((i) => i.info_type !== "SIZE")}
            policies={data.policy}
          />
        </div>
      </div>
      {data.data.relatedproduct && (
        <div className="relatedproduct__section w-full h-full">
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
          <div className="w-full h-fit flex flex-col gap-y-2 items-center justify-center p-2 rounded-xl border border-gray-200 hover:border-gray-900 transition-colors duration-200 cursor-pointer">
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
    if (data.maxprod) isLimit = data.maxprod;
  }

  return (
    data.data &&
    data.data.length > 0 && (
      <section className="mt-16 flex flex-col gap-y-6 border-t border-gray-200 pt-10">
        <h2 className="text-xl font-bold w-full h-fit text-left text-gray-900">
          You might also like
        </h2>

        <div className="w-full h-fit flex flex-row overflow-x-auto gap-x-5 pb-2 snap-x">
          {relatedproduct?.map((prod, idx) => (
            <div key={prod.id} className="w-60 sm:w-72 shrink-0 snap-start">
              <Card
                name={prod.name}
                price={prod.price.toFixed(2)}
                img={prod.covers}
                index={idx}
                discount={prod.discount as Orderpricetype}
                id={prod.id}
              />
            </div>
          ))}
        </div>

        {!isLimit && <ButtonForSimilarProd lt={limit} />}
      </section>
    )
  );
};
