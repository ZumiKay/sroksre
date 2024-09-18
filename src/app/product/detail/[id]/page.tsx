import { notFound } from "next/navigation";
import { GetProductDetailById } from "./detail_action";
import { ButtonForSimilarProd, OptionSection, ShowPrice } from "./Component";
import { Relatedproducttype } from "@/src/context/GlobalContext";
import Link from "next/link";
import ToggleMenu from "@/src/app/component/ToggleMenu";
import { getRelatedProduct } from "./action";
import Card from "@/src/app/component/Card";

import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Props } from "../../page";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id);

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
  };
}

interface SearchParamType {
  lt?: string;
}
export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | undefined };
}) {
  const user = await getUser();
  if (!params.id) {
    return notFound();
  }

  const searchparam = searchParams as SearchParamType;

  const { success, data } = await GetProductDetailById(params.id);

  if (!success || !data?.data) {
    return notFound();
  }

  return (
    <div className="productdetail__container h-full pt-5">
      <div
        className="product_section flex flex-row w-full h-fit 
      max-smallest_tablet:flex-col max-smallest_tablet:items-center"
      >
        <div className="h-fit grid grid-cols-2 gap-y-2 place-items-start w-full max-large_tablet:flex max-large_tablet:flex-row max-large_tablet:justify-between max-large_tablet:items-center max-large_tablet:overflow-x-auto">
          {data?.data.covers.map((img, idx) => (
            <div
              className="w-[450px] h-full 
              max-h-[550px] max-large_tablet:w-full 
              max-large_tablet:h-[450px]"
              key={img.id}
            >
              <Image
                src={img.url}
                alt={`Cover ${idx + 1}`}
                className="w-full h-full object-cover"
                width={777}
                height={777}
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <div
          className="product_detail  w-3/4 max-smallest_tablet:w-[95vw] 
        max-smallest_tablet:pl-0 flex flex-col pl-4 gap-y-10 h-fit"
        >
          <h3 className="product_name text-3xl font-bold h-fit pt-1 break-words">
            {data?.data.name}
          </h3>
          <p className="product_description text-lg font-normal w-full">
            {data?.data.description ?? "No Description"}
          </p>
          <ShowPrice
            price={data?.data.price ?? 0}
            discount={data?.data.discount}
          />

          {data?.data.relatedproduct && data.data.relatedproduct.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Other Version</h3>
              <ShowRelated data={data.data.relatedproduct} />
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
                name={pol.title}
                isAdmin={false}
                paragraph={pol.Paragraph}
              />
            ))}
          </div>
        </div>
      </div>
      {data.data.relatedproduct && data.data.relatedproduct.length > 0 && (
        <div className="relatedproduct__section w-full h-full mt-10 flex flex-col gap-y-10">
          <ShowSimilarProduct
            pid={params.id}
            parent_id={data?.data.category.parent_id ?? 0}
            child_id={data?.data.category.child_id}
            promoid={data?.data.promotion_id}
            limit={searchparam.lt ? parseInt(searchparam.lt) : undefined}
          />
        </div>
      )}
    </div>
  );
}

const ShowRelated = ({ data }: { data: Relatedproducttype[] }) => {
  return (
    <div className="w-full h-fit grid grid-cols-3 gap-y-5">
      {data.map((related) => (
        <Link href={`/product/detail/${related.id}`}>
          <div
            key={related.id}
            className="w-[200px] h-fit flex flex-col gap-y-3 items-center justify-center p-2 rounded-lg border-2 border-black transition-all duration-200 hover:bg-black hover:text-white cursor-pointer"
          >
            <img
              src={related.covers[0].url}
              alt="cover"
              className="w-[100px] h-[100px] object-cover rounded-lg"
              loading="lazy"
            />
            <h3 className="w-full text-center">{related.name}</h3>
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
    promoid
  );

  if (data.success) {
    relatedproduct = data.data;
    data.maxprod && (isLimit = data.maxprod);
  }

  return (
    data.data && (
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
              discount={prod.discount}
              id={prod.id}
            />
          ))}
        </div>

        {!isLimit && <ButtonForSimilarProd lt={limit} />}
      </>
    )
  );
};
