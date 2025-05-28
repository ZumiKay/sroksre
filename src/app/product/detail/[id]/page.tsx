"use server";

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { GetProductDetailById } from "./detail_action";
import { ButtonForSimilarProd, OptionSection, ShowPrice } from "./Component";
import ToggleMenu from "@/src/app/component/ToggleMenu";
import Card from "@/src/app/component/Card";
import { getRelatedProduct } from "./action";
import { getUser } from "@/src/app/action";
import Prisma from "@/src/lib/prisma";

import { Props } from "../../page";
import { Relatedproducttype } from "@/src/context/GlobalType.type";

// Type definitions
interface SearchParamType {
  lt?: string;
}

// Metadata generation
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const id = parseInt(params.id);

  const product = await Prisma.products.findUnique({
    where: { id },
    select: {
      name: true,
      parentcateogries: {
        select: { name: true },
      },
      childcategories: {
        select: { name: true },
      },
    },
  });

  if (!product) return { title: "" };

  const title = `${product.name ?? ""} | SrokSre`;
  const description = `${product.name} ${
    product.parentcateogries?.name ?? ""
  } ${product.childcategories?.name ?? ""} at SrokSre online store`;

  return { title, description };
}

// Component for showing related products
const RelatedProductGrid = ({ data }: { data: Relatedproducttype[] }) => {
  return (
    <div className="grid grid-cols-3 gap-y-5 w-full">
      {data.map((related) => (
        <Link key={related.id} href={`/product/detail/${related.id}`}>
          <div
            className="flex flex-col items-center justify-center gap-y-3 p-2 w-[200px] h-fit 
                         border-2 border-black rounded-lg 
                         transition-all duration-200 hover:bg-black hover:text-white cursor-pointer"
          >
            <Image
              src={related.covers[0].url}
              alt={related.name}
              className="w-[100px] h-[100px] object-cover rounded-lg"
              width={200}
              height={200}
              loading="lazy"
            />
            <h3 className="w-full text-center text-sm">{related.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
};

// Component for showing similar products
const SimilarProductSection = async ({
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
  const { success, data, maxprod } = await getRelatedProduct(
    parseInt(pid, 10),
    parent_id,
    limit,
    child_id,
    promoid
  );

  if (!success || !data || data.length === 0) {
    return null;
  }

  const isMaxLimitReached = maxprod ?? true;

  return (
    <>
      <h3 className="text-lg font-bold w-full text-left pl-2">
        You might also like:
      </h3>

      <div className="flex flex-row gap-x-5 overflow-x-auto pb-4">
        {data.map((prod, idx) => (
          <Card
            key={idx}
            name={prod.name}
            price={prod.price.toFixed(2)}
            img={prod.covers}
            index={idx}
            discount={prod.discount}
            id={prod.id}
          />
        ))}
      </div>

      {!isMaxLimitReached && <ButtonForSimilarProd lt={limit} />}
    </>
  );
};

// Main component
export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const user = await getUser();

  if (!params.id) {
    return notFound();
  }

  const searchparam = searchParams as SearchParamType;
  const { success, data } = await GetProductDetailById(params.id);

  if (!success || !data?.data) {
    return notFound();
  }

  const productData = data.data;
  const hasRelatedProducts =
    productData.relatedproduct && productData.relatedproduct.length > 0;

  return (
    <div className="pt-5 h-full">
      {/* Product main section */}
      <section className="flex flex-row w-full h-fit max-smallest_tablet:flex-col max-smallest_tablet:items-center">
        {/* Product images */}
        <div className="w-full h-fit overflow-x-auto">
          <div className="grid grid-cols-2 gap-3 w-full max-small_screen:flex max-small_screen:flex-row max-small_screen:items-center">
            {productData.covers.map((img, idx) => (
              <Image
                key={idx}
                src={img.url}
                alt={`${productData.name} - Image ${idx + 1}`}
                className="w-[400px] h-[500px] object-cover max-medium_screen:w-[350px] max-medium_screen:h-[450px]"
                width={777}
                height={777}
                loading={idx === 0 ? "eager" : "lazy"}
                priority={idx === 0}
              />
            ))}
          </div>
        </div>

        {/* Product details */}
        <div className="w-3/4 pl-4 flex flex-col gap-y-10 h-fit max-smallest_tablet:w-[95vw] max-smallest_tablet:pl-0">
          <h1 className="text-3xl font-bold h-fit pt-1 break-words">
            {productData.name}
          </h1>

          <p className="text-lg font-normal w-full">
            {productData.description ?? "No Description"}
          </p>

          <ShowPrice
            price={productData.price ?? 0}
            discount={productData.discount}
          />

          {/* Other versions section */}
          {hasRelatedProducts && productData.relatedproduct && (
            <>
              <h3 className="text-lg font-bold">Other Version</h3>
              <RelatedProductGrid data={productData.relatedproduct} />
            </>
          )}

          {/* Product options */}
          <div className="w-full h-fit flex flex-col gap-y-5">
            <OptionSection
              data={productData}
              isAdmin={user?.role === "ADMIN"}
              isInWishlist={
                data.isInWishlist ? data.isInWishlist.isExist : false
              }
              isInCart={data.incart}
            />
          </div>

          {/* Product details and policies */}
          <div className="w-full h-full flex flex-col justify-start gap-y-2">
            <ToggleMenu
              name="Product Detail"
              isAdmin={false}
              data={productData.details}
            />

            {data.policy.map((pol) => (
              <ToggleMenu
                key={pol.id}
                name={pol.title}
                isAdmin={false}
                paragraph={pol.Paragraph}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Related products section */}
      {productData.relatedproduct && (
        <section className="w-full h-full mt-10 flex flex-col gap-y-10">
          <SimilarProductSection
            pid={params.id}
            parent_id={productData.category?.parent?.id ?? 0}
            child_id={productData.category?.child?.id ?? 0}
            promoid={productData.promotion_id}
            limit={searchparam.lt ? parseInt(searchparam.lt) : undefined}
          />
        </section>
      )}
    </div>
  );
}
