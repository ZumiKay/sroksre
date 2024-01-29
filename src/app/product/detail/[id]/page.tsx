"use client";
import Image from "next/image";
import Default from "../../../Asset/Image/default.png";
import PrimaryButton, { Selection } from "../../../component/Button";
import Card from "../../../component/Card";
import ToggleMenu from "../../../component/ToggleMenu";
import {
  AllDataInitialize,
  ProductState,
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useEffect, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { SelectContainer } from "@/src/app/component/FormComponent";

interface productdetailprops {
  params: { id: number };
}
export default function ProductDetail({ params }: productdetailprops) {
  const { seterror, setalldata } = useGlobalContext();
  const [prob, setprob] = useState<ProductState>(Productinitailizestate);

  const fetchproductdetail = async () => {
    setalldata(AllDataInitialize);
    const productrequest = await ApiRequest(
      `/api/products/ty=info_pid=${params.id}`,
      undefined,
      "GET"
    );
    if (!productrequest.success) {
      seterror(true);
      return;
    }
    setprob(productrequest.data);
  };
  useEffect(() => {
    fetchproductdetail();
  }, []);

  return (
    <div className="productdetail__container h-full pb-10 pt-5">
      <section className="product_section flex flex-row w-full h-fit">
        <div className="product_image min-h-[100vh]  grid grid-cols-2 gap-y-2 gap-x-2 place-items-start w-full">
          {prob.covers.map((img) => (
            <Image
              src={img.url ?? Default}
              alt={"Cover"}
              className="product_cover w-[450px] h-[550px] object-cover"
              width={1000}
              height={1000}
              loading="eager"
              priority={true}
            />
          ))}
        </div>
        <div className="product_detail  w-3/4 flex flex-col pl-4 gap-y-10">
          <h1 className="product_name text-3xl font-bold max-h-[105px] pt-1 break-words overflow-y-auto">
            {" "}
            {prob.name}{" "}
          </h1>
          <h3 className="product_description text-lg font-normal w-full">
            {prob.description ?? "No Description"}
          </h3>
          {prob.discount ? (
            <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
              <h3 className="oldprice line-through w-fit font-normal">
                {`$ ${parseFloat(prob.price.toString()).toFixed(2)}`}
              </h3>
              <h3 className="w-fit text-red-400">
                {`-${prob.discount.percent}%`}
              </h3>
              <h3 className="w-fit">{`$ ${prob.discount.newPrice}`}</h3>
            </div>
          ) : (
            <h3 className="text-lg font-bold w-full">
              {`$ ${parseFloat(prob.price.toString()).toFixed(2)}`}
            </h3>
          )}

          {prob.details
            .filter((i) => i.info_type === "SIZE")
            .map((detail) => (
              <Selection
                default="Select"
                label={"Size"}
                data={detail.info_value}
              />
            ))}

          <Selection
            label="Quantity"
            default="Select"
            data={Array.from(
              { length: prob.stock > 1 ? (90 / 100) * prob.stock : prob.stock },
              (_, index) => index + 1
            )}
          />

          {prob.stock <= 3 && (
            <h3 className="product_comment text-red-500">
              {" "}
              Hurry Before Sold Out !!{" "}
            </h3>
          )}
          <ToggleMenu
            name="ProductDetail"
            isAdmin={false}
            data={prob.details.filter((i) => i.info_type !== "COLOR")}
          />
          <div className="product_action pt-2 flex flex-col items-center gap-y-2">
            <PrimaryButton
              type="button"
              text="Add To Cart"
              color="white"
              textcolor="black"
              border="1px solid black"
              radius="10px"
              width="99%"
            />
            <PrimaryButton type="button" text="Buy" radius="10px" width="99%" />
          </div>
          <ToggleMenu name="Shipping & Return" isAdmin={false} />
        </div>
      </section>
      <section className="relatedproduct__section w-full mt-5">
        <h1 className="bg-[#495464] w-full p-2 text-white font-bold text-xl">
          Related Products
        </h1>
        <div className="relatedproduct_list w-full grid grid-cols-3 gap-y-12 place-items-center">
          {[1, 1, 2, 3, 2, 3, 2, 2].map((i) => (
            <Card name="Related Product" price="$10.00" img={[]} />
          ))}
        </div>
      </section>
    </div>
  );
}
