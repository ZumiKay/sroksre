import {
  Orderpricetype,
  Productorderdetailtype,
} from "@/src/context/OrderContext";
import Image from "next/image";

export const Checkoutproductcard = ({
  qty,
  total,
  price,
  cover,
  details,
  name,
}: {
  qty: number;
  total: number;
  price: Orderpricetype;
  cover: string;
  name: string;
  details?: Productorderdetailtype[];
}) => {
  return (
    <div
      key={cover}
      className={"w-full h-[250px] bg-white rounded-lg flex flex-row gap-x-5"}
    >
      <Image
        src={cover}
        width={200}
        height={200}
        alt="thumbnail"
        className="w-[150px] h-auto rounded-lg object-cover"
        loading="lazy"
      />
      <div className="w-[60%] min-h-[200px] flex flex-col items-start gap-y-3 relative">
        <h3 className="text-lg font-bold w-fit h-fit">{name}</h3>
        <div className="w-full flex flex-col max-h-[120px] overflow-y-auto gap-y-5">
          <ShowDetails details={details ?? []} />
        </div>
        <ShowPrice total={total} qty={qty} price={price} />
      </div>
    </div>
  );
};

const detailcard = (text: string, bg?: string) => {
  return (
    <div
      style={
        bg
          ? {
              width: "30px",
              backgroundColor: bg,
              borderRadius: "100%",
              height: "30px",
            }
          : {}
      }
      className="detailinfo w-fit max-w-full grid place-content-center h-fit break-all text-lg bg-gray-300 text-center font-medium p-1 rounded-lg"
    >
      {text}
    </div>
  );
};

const ShowPrice = ({
  price,
  total,
  qty,
}: {
  price: Orderpricetype;
  total: number;
  qty: number;
}) => {
  const isDiscount = price.discount;
  const Price = parseFloat(price.price.toString()).toFixed(2);

  return (
    <div className="w-full h-fit flex flex-row items-center justify-between absolute bottom-5">
      <div className="price flex flex-row items-center gap-x-3 w-full h-full">
        <h3
          hidden={!isDiscount}
          className="text-lg font-normal text-red-500 line-through"
        >
          ${Price}
        </h3>
        <h3 className="text-lg font-normal">
          ${isDiscount ? isDiscount.newprice?.toFixed(2) : Price}
        </h3>
        <h3 className="text-lg font-normal">{`x${qty}`}</h3>
      </div>
      <h3 className="text-lg font-bold">
        ${parseFloat(total.toString()).toFixed(2)}
      </h3>
    </div>
  );
};

const ShowDetails = ({
  details,
}: {
  details: Array<Productorderdetailtype>;
}) => {
  return (
    <>
      <div className="w-full h-fit grid grid-cols-3 gap-x-5 gap-y-5">
        {details
          ?.filter((opt) => opt.option_type !== "COLOR")
          ?.map((opt) => detailcard(opt.option_value))}
      </div>

      {details?.filter((i) => i.option_type === "COLOR").length !== 0 && (
        <div className="w-full h-fit flex flex-row gap-x-5 items-center">
          <h3>Color: </h3>
          {details
            ?.filter((opt) => opt.option_type === "COLOR")
            ?.map((opt) => detailcard("", opt.option_value))}
        </div>
      )}
    </>
  );
};
