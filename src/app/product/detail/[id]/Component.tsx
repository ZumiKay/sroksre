"use client";

import PrimaryButton, {
  SelectContainer,
  Selection,
} from "@/src/app/component/Button";

import {
  Productdetailinitialize,
  ProductState,
  ProductStockType,
  Stocktype,
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import React, { useState } from "react";
import { Addtocart, AddWishlist } from "./action";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import { useRouter, useSearchParams } from "next/navigation";

export const ShowPrice = ({
  price,
  discount,
}: Pick<ProductState, "price" | "discount">) => {
  const priceString = price.toFixed(2);
  const isDiscount = discount && (
    <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
      <h3 className="oldprice line-through w-fit font-normal">
        {`$ ${priceString}`}
      </h3>
      <h3 className="w-fit text-red-400">{`-${discount.percent}%`}</h3>
      <h3 className="w-fit">{`$ ${parseFloat(discount.newprice).toFixed(
        2
      )}`}</h3>
    </div>
  );
  const normalprice = (
    <h3 className="text-lg font-bold w-full">{`$${priceString}`}</h3>
  );

  return isDiscount ? isDiscount : normalprice;
};

interface errormessType {
  qty?: string;
  option?: string;
}

const InitializeDetail = (size: number) =>
  Array.from({ length: size }).fill(null);

export const OptionSection = ({
  data,
  isAdmin,
  isInWishlist,
  isInCart,
}: {
  data: Pick<
    ProductState,
    "id" | "stocktype" | "stock" | "variants" | "varaintstock"
  >;
  isAdmin: boolean;
  isInWishlist: boolean;
  isInCart: boolean;
}) => {
  const { productorderdetail, setproductorderdetail, setcarttotal } =
    useGlobalContext();
  const [loading, setloading] = useState(false);
  const [errormess, seterrormess] = useState<errormessType>({
    option: "",
    qty: "",
  });
  const [qty, setqty] = useState(0);
  const [incart, setincart] = useState(isInCart);

  useEffectOnce(() => {
    const InitializeProductOrder = (
      data: Pick<
        ProductState,
        "id" | "stocktype" | "stock" | "variants" | "varaintstock"
      >
    ) => {
      let type = data.stocktype;

      if (type !== ProductStockType.stock) {
        const arr = InitializeDetail(
          type === "size" ? 1 : data.variants ? data.variants?.length : 0
        ) as any[];

        setproductorderdetail(
          (prev) =>
            ({
              ...prev,
              id: data.id as number,
              details: arr,
            } as Productordertype)
        );
      } else {
        setproductorderdetail(
          (prev) => ({ ...prev, id: data.id as number } as Productordertype)
        );
      }
    };

    InitializeProductOrder(data);
    seterrormess({
      ...(data.stocktype === ProductStockType.stock
        ? { qty: "Please Select Quantity" }
        : { option: "Please Select Option" }),
    });
  });

  const handleWishlist = async () => {
    const makereq = AddWishlist.bind(null, data.id ?? 0);

    const added = await makereq();
    if (!added.success) {
      errorToast(added.message);
      return;
    }

    successToast(added.message);
  };

  const checkallrequireddetail = () => {
    const { stocktype } = data;
    const { details, quantity } = productorderdetail ?? {};

    const ishaveQty = quantity !== 0;
    if (stocktype === "stock") {
      if (!ishaveQty) {
        seterrormess(
          !ishaveQty
            ? { qty: "Please Select the quantity", option: "" }
            : { option: "", qty: "" }
        );
        return false;
      }
    } else {
      const isSelectedDetails =
        details &&
        details.filter((i) => i).length !== 0 &&
        details.filter((i) => i).some((i) => i.value.length !== 0);

      const isValid = isSelectedDetails && ishaveQty;

      if (!isValid) {
        seterrormess(
          !isSelectedDetails
            ? { option: "Please Select one of the option", qty: "" }
            : !ishaveQty
            ? { qty: "Please Select the quantity", option: "" }
            : { option: "", qty: "" }
        );

        return false;
      }
    }
    return true;
  };

  const handleCart = async () => {
    const checked = checkallrequireddetail();

    if (!checked || !productorderdetail) {
      return;
    }

    const addtocart = Addtocart.bind(null, productorderdetail);
    const makerequest = await addtocart();

    if (!makerequest.success) {
      errorToast(makerequest.message ?? "Error Occured");
      return;
    }

    successToast("Added to cart");
    setproductorderdetail(Productdetailinitialize);
    setincart(true);
    setcarttotal((prev) => prev + 1);
  };

  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      {/* {loading && <ContainerLoading />} */}
      <h3 className="error_mess text-lg text-red-500 font-bold w-full h-full">
        {data.stocktype === ProductStockType.stock
          ? errormess?.qty
          : errormess?.option}
      </h3>
      <div className="w-full h-fit overflow-x-hidden overflow-y-auto flex flex-col gap-y-5 pl-2">
        <ShowOptionandStock
          prob={data}
          qty={qty}
          setqty={setqty}
          errormess={errormess}
          setmess={seterrormess}
          setloading={setloading}
          setincart={setincart}
        />
      </div>

      <div className="product_action w-full pt-2 flex flex-col items-center gap-y-2">
        <PrimaryButton
          type="submit"
          text={incart ? "In Cart" : "Add To Cart"}
          disable={productorderdetail?.quantity === 0 || incart || isAdmin}
          onClick={() => handleCart()}
          status={loading ? "loading" : "authenticated"}
          color="white"
          textcolor="black"
          border="1px solid black"
          radius="10px"
          width="99%"
        />
        <PrimaryButton
          type="button"
          text={isInWishlist ? "In Wishlist" : "Add To Wishlist"}
          color="black"
          radius="10px"
          width="100%"
          Icon={<i className="fa-regular fa-heart text-lg"></i>}
          onClick={() => !isInWishlist && handleWishlist()}
        />
      </div>
    </div>
  );
};

const stock = (
  max: number,
  errormess: errormessType,
  setmess: React.Dispatch<React.SetStateAction<errormessType>>,
  incart?: boolean,
  isStock?: boolean
) => {
  const showLowStock = max ? max <= 5 : false;
  const { setproductorderdetail, productorderdetail } = useGlobalContext();

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    isStock?: boolean
  ) => {
    setmess({ qty: "", option: "" });
    let { value, name } = e.target;
    let val = 0;

    if (name === "quantity") {
      val = value !== "QTY" ? parseInt(value) : 0;
    }

    setproductorderdetail(
      (prev) =>
        ({
          ...prev,
          ...(isStock ? { details: [] } : {}),
          [e.target.name]: val,
        } as Productordertype)
    );
  };

  return (
    <div className="flex flex-col gap-y-3">
      <label htmlFor="qty" className="text-lg font-bold">
        Quantity
      </label>
      <Selection
        default="QTY"
        data={Array.from({ length: max }).map((_, idx) => ({
          label: idx + 1,
          value: idx + 1,
        }))}
        style={{ height: "50px", width: "200px", maxWidth: "250px" }}
        onChange={(e) => handleChange(e, isStock)}
        disable={max === 0 || incart}
        value={productorderdetail?.quantity}
        name="quantity"
      />

      <h3 className="text-lg text-red-500 w-full text-left font-bold">
        {`  ${
          max === 0 ? errormess.qty ?? "" : showLowStock ? "Low on stock" : ""
        }`}
      </h3>
    </div>
  );
};

const getQtyBasedOnOptions = (
  variantstock: Stocktype[],
  orderdetail: Productorderdetailtype[]
): number => {
  // Create a Set of order detail values for faster lookup
  const orderdetailValuesSet = new Set(
    orderdetail.map((i) => i.value).filter(Boolean)
  );

  for (const stock of variantstock) {
    for (const variant of stock.Stockvalue) {
      const filteredVariant = variant.variant_val.filter(
        (val) => val !== "null"
      );

      if (
        filteredVariant.length === orderdetailValuesSet.size &&
        filteredVariant.every((val) => orderdetailValuesSet.has(val))
      ) {
        return variant.qty; // Early return on first match
      }
    }
  }

  return 0;
};

const inCartCheck = async (
  selecteddetail: Productorderdetailtype[],
  pid: number
) => {
  const req = await ApiRequest(
    "/api/order/cart/check",
    undefined,
    "POST",
    "JSON",
    { selecteddetail, pid }
  );
  return {
    success: req.success,
    incart: (req.data?.incart ?? false) as boolean,
  };
};

const Variant = (
  id: number,
  name: string,
  type: "COLOR" | "TEXT",
  idx: number,
  data: (string | VariantColorValueType)[],
  prob: Pick<ProductState, "id" | "varaintstock" | "variants">,
  errormess: errormessType,
  setmess: React.Dispatch<React.SetStateAction<errormessType>>,
  setqty: React.Dispatch<React.SetStateAction<number>>,
  setloading: React.Dispatch<React.SetStateAction<boolean>>,
  setincart: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { productorderdetail, setproductorderdetail } = useGlobalContext();
  const detail = productorderdetail?.details
    ?.filter((i) => i)
    .find((i) => i.variant_id === id);
  const selected = detail ? detail.value : undefined;

  const handleSelectVariant = async (idx: number, value: string) => {
    const Allvariant = [...(prob.variants ?? [])];
    const variant = Allvariant[idx];
    let mess = { ...errormess };

    let orderDetail = { ...productorderdetail } as Productordertype;
    if (!orderDetail.details) {
      return;
    }
    const isValid = orderDetail.details.filter((i) => i);
    const isExist =
      isValid.length !== 0 ? isValid.findIndex((i) => i.id === variant.id) : -1;

    let selectedvariant: Productorderdetailtype = {
      variant_id: variant.id ?? 0,
      value: value,
    };

    const isSelected =
      isValid.length !== 0
        ? orderDetail.details[idx]
          ? orderDetail.details[idx].value === selectedvariant.value
          : false
        : false;

    if (isSelected) {
      orderDetail.details[idx] = {
        variant_id: 0,
        value: "",
      };
      setincart(false);
    } else {
      if (isExist === -1) {
        orderDetail.details[idx] = selectedvariant;
      } else if (isExist !== -1) {
        orderDetail.details[isExist].value = selectedvariant.value;
      }
    }

    //update qty
    const maxqty: number = prob.varaintstock
      ? getQtyBasedOnOptions(
          prob.varaintstock,
          orderDetail.details.filter((i) => i)
        )
      : 0;

    if (
      orderDetail.details.filter((i) => i).every((i) => i.value.length === 0)
    ) {
      mess.qty = "";
    } else {
      mess.qty = maxqty === 0 ? "Product Unvaliable" : "";
    }
    mess.option = "";

    if (maxqty && prob.id) {
      setloading(true);
      const checkreq = await inCartCheck(
        orderDetail.details.filter((i) => i && i.value.length !== 0),
        prob.id
      );
      setincart(checkreq.incart);
      setloading(false);
    }
    setmess(mess);
    setqty(maxqty);
    setproductorderdetail(orderDetail);
  };

  return (
    <div key={idx} className="w-full h-fit flex flex-col gap-y-5">
      <label htmlFor={name} className="text-lg font-bold w-fit h-fit">
        {name}
      </label>
      <SelectContainer
        type={type}
        data={data}
        onSelect={(val) => handleSelectVariant(idx, val)}
        isSelected={selected}
      />
    </div>
  );
};

const ShowOptionandStock = ({
  prob,
  qty,
  errormess,
  setmess,
  setqty,
  setloading,
  setincart,
}: {
  prob: Pick<ProductState, "stocktype" | "stock" | "variants" | "varaintstock">;
  qty: number;
  errormess: errormessType;
  setmess: React.Dispatch<React.SetStateAction<errormessType>>;
  setqty: React.Dispatch<React.SetStateAction<number>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setincart: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const type = prob.stocktype;
  const Productunvaliable = (
    <h3 className="text-lg text-gray-400 font-medium"> Product Unavaliable </h3>
  );

  return type === "stock" ? (
    prob.stock && prob.stock > 0 ? (
      stock(prob.stock, errormess, setmess, undefined, true)
    ) : (
      Productunvaliable
    )
  ) : prob.variants ? (
    <>
      {prob.variants.map((i, idx) =>
        Variant(
          i.id ?? 0,
          i.option_title,
          i.option_type,
          idx,
          i.option_value,
          prob,
          errormess,
          setmess,
          setqty,
          setloading,
          setincart
        )
      )}
      {prob.varaintstock && prob.varaintstock.length !== 0
        ? stock(qty, errormess, setmess, undefined)
        : qty === 0
        ? Productunvaliable
        : ""}
    </>
  ) : (
    <></>
  );
};

export const ButtonForSimilarProd = ({ lt }: { lt: number }) => {
  const router = useRouter();
  const searchParam = useSearchParams();

  return (
    <div className="w-full h-fit flex justify-center">
      <PrimaryButton
        type="button"
        text="Load more"
        radius="10px"
        width="20%"
        height="40px"
        style={{ marginTop: "100px" }}
        onClick={() => {
          const param = new URLSearchParams(searchParam);
          param.set("lt", `${lt + 3}`);
          router.push(`?${param}`, { scroll: false });
          router.refresh();
        }}
      />
    </div>
  );
};
