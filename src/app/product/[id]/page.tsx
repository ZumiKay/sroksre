import Image from "next/image";
import Default from "../../Asset/Image/default.png";
import PrimaryButton, { Selection } from "../../component/Button";
import Card from "../../component/Card";
import ToggleMenu from "../../component/ToggleMenu";

interface productdetailprops {
  params: { id: string };
}
export default function ProductDetail(props: productdetailprops) {
  return (
    <div className="productdetail__container">
      <section className="product_section flex flex-row w-full h-fit">
        <div className="product_image  grid grid-cols-2 gap-y-2 gap-x-2 place-items-center w-full">
          <Image
            src={Default}
            alt="cover"
            className="product_cover w-[400px] h-[550px] object-cover"
          />
          <Image
            className="product_cover w-[400px] h-[550px] object-cover"
            src={Default}
            alt="cover"
          />
          <Image
            src={Default}
            alt="cover"
            className="product_cover w-[400px] h-[550px] object-cover"
          />
          <Image
            src={Default}
            alt="cover"
            className="product_cover w-[400px] h-[550px] object-cover"
          />
        </div>
        <div className="product_detail  w-3/4 flex flex-col pl-4 gap-y-10">
          <h1 className="product_name text-3xl font-bold max-h-[105px] pt-1 break-words overflow-y-auto">
            {" "}
            Name Of Products{" "}
          </h1>
          <p className="product_price text-lg font-semibold"> Price </p>
          <div className="product_rating text-lg font-semibold"> Rating </div>
          <Selection default="Select" label="ProductDetail" />

          <Selection label="Quantity" default="Select" />
          <h3 className="product_comment text-red-500"> Special Comment </h3>
          <ToggleMenu name="ProductDetail" />
          <div className="product_action flex flex-col items-center gap-y-2">
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
          <ToggleMenu name="Shipping & Return" />
        </div>
      </section>
      <section className="relatedproduct__section w-full mt-5">
        <h1 className="bg-[#495464] w-full p-2 text-white font-bold text-xl">
          Related Products
        </h1>
        <div className="relatedproduct_list w-full grid grid-cols-3 gap-y-12 place-items-center">
          {[1, 1, 2, 3, 2, 3, 2, 2].map((i) => (
            <Card
              name="Related Product"
              price="$10.00"
              img={[]}
              button={true}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
