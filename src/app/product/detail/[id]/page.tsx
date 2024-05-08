"use client";
import Image from "next/image";
import Default from "../../../../../public/Image/default.png";
import PrimaryButton, {
  SelectContainer,
  Selection,
} from "../../../component/Button";

import ToggleMenu from "../../../component/ToggleMenu";
import {
  ProductState,
  ProductStockType,
  Productinitailizestate,
  Stocktype,
  Varianttype,
  infovaluetype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useEffect, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "@/src/app/component/Loading";
import { Addtocart, CheckCart } from "./action";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface productdetailprops {
  params: { id: number };
}

const InitializeDetail = (size: number) =>
  Array.from({ length: size }).fill(null);
const errormessInitialize = {
  option: "",
  qty: "",
};

//Helper Method
const getQtyBasedOnOptions = (
  variantstock: Stocktype[],
  orderdetail: Productorderdetailtype[]
) => {
  let totalqty = 0;

  let orderdetailvalue = orderdetail.map((i) => i.option_value).filter(Boolean);

  variantstock.forEach((i) => {
    const varaint_val = i.variant_val.filter((val) => val !== "null");

    if (
      varaint_val.length === orderdetailvalue.length &&
      varaint_val.every((val) => orderdetailvalue.includes(val))
    ) {
      totalqty = i.qty;
    }
  });

  return totalqty;
};

const Productdetailinitialize: Productordertype = {
  id: 0,
  details: [],
  quantity: 0,
  price: { price: 0 },
};
let toast = false;
export default function ProductDetail({ params }: productdetailprops) {
  const { seterror } = useGlobalContext();
  const [productorderdetail, setproductorderdetail] =
    useState<Productordertype>(Productdetailinitialize);
  const [prob, setprob] = useState<ProductState>(Productinitailizestate);
  const [loading, setloading] = useState(true);
  const [incart, setincart] = useState(false);
  const [qty, setqty] = useState(0);

  const [errormess, setmess] = useState(errormessInitialize);
  const router = useRouter();

  const InitializeProductOrder = (data: ProductState) => {
    let type = data.stocktype;

    if (type !== ProductStockType.stock) {
      const arr = InitializeDetail(
        type === "size" ? 1 : data.variants ? data.variants?.length : 0
      ) as any[];

      setproductorderdetail(
        (prev) =>
          ({ ...prev, id: data.id as number, details: arr } as Productordertype)
      );
    } else {
      setproductorderdetail(
        (prev) => ({ ...prev, id: data.id as number } as Productordertype)
      );
    }
  };

  const fetchproductdetail = async () => {
    setloading(true);
    const productrequest = await ApiRequest(
      `/api/products/ty=info_pid=${params.id}`,
      undefined,
      "GET"
    );

    setloading(false);
    if (!productrequest.success) {
      seterror(true);
      return;
    }

    const checkcart = CheckCart.bind(null, undefined, params.id);
    const checkrequest = await checkcart();

    if (!checkrequest.success) {
      !toast && errorToast(checkrequest.message ?? "Error occured");
      toast = true;
      return;
    }

    setincart(checkrequest.incart as boolean);

    const { data } = productrequest;

    InitializeProductOrder(data);

    setprob(data);
    setmess((prev) => ({
      ...prev,
      option:
        data.stocktype === "size"
          ? "Please select size"
          : "Please select option",
    }));
  };
  useEffect(() => {
    fetchproductdetail();
  }, []);

  const handleSelectVariant = async (idx: number, value: string) => {
    const Allvariant = prob.variants as Varianttype[];
    const variant = Allvariant[idx];
    let mess = { ...errormess };

    let orderDetail = { ...productorderdetail } as Productordertype;
    const isValid = orderDetail.details.filter((i) => i);
    const isExist =
      isValid.length !== 0
        ? isValid.findIndex((i) => i.option_title === variant.option_title)
        : -1;

    let selectedvariant: Productorderdetailtype = {
      ...variant,
      option_value: value,
    };

    const isSelected =
      isValid.length !== 0
        ? orderDetail.details[idx]
          ? orderDetail.details[idx].option_value ===
            selectedvariant.option_value
          : false
        : false;

    if (isSelected) {
      orderDetail.details[idx] = {
        option_title: "",
        option_type: "",
        option_value: "",
      };
      setincart(false);
    } else {
      if (isExist === -1) {
        orderDetail.details[idx] = selectedvariant;
      } else if (isExist !== -1) {
        orderDetail.details[isExist].option_value =
          selectedvariant.option_value;
      }
    }

    //update qty
    const maxqty = prob.varaintstock
      ? getQtyBasedOnOptions(
          prob.varaintstock,
          orderDetail.details.filter((i) => i)
        )
      : 0;
    setqty(maxqty);
    if (
      orderDetail.details
        .filter((i) => i)
        .every((i) => i.option_value.length === 0)
    ) {
      mess.qty = "";
    } else {
      mess.qty = maxqty === 0 ? "Product Unvaliable" : "";
    }
    mess.option = "";
    await inCartCheck(
      orderDetail.details.filter((i) => i && i.option_title.length !== 0)
    );
    setmess(mess);

    setproductorderdetail(orderDetail);
  };

  const handleSelectSize = async (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    let orderdetail = { ...productorderdetail } as Productordertype;
    let probdetail = [...orderdetail.details].filter((i) => i);
    const isExist = probdetail.findIndex((i) => i.option_type === "SIZE");
    if (isExist === -1) {
      probdetail.push({
        option_title: "Size",
        option_type: "SIZE",
        option_value: value,
      });
    } else {
      if (value.length === 0) {
        probdetail.splice(isExist, 1);
        setincart(false);
      } else {
        probdetail[isExist].option_value = value;
      }

      //check in cart
    }
    let size = prob.details.filter((i) => i.info_type === "SIZE");
    let toqty = 0;

    size.forEach((i) => {
      i.info_value.forEach((j) => {
        const { val, qty } = j as infovaluetype;
        if (val === value) {
          toqty = qty;
        }
      });
    });

    if (value.length === 0) {
      toqty = 0;
    }
    await inCartCheck(
      probdetail.filter((i) => i && i.option_title.length !== 0)
    );
    setmess(errormessInitialize);
    setqty(toqty);

    setproductorderdetail(
      (prev) => ({ ...prev, details: probdetail } as Productordertype)
    );
  };

  const handleChange = (
    e: ChangeEvent<HTMLSelectElement>,
    isStock?: boolean
  ) => {
    setmess(errormessInitialize);
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

  const stock = (max: number, isStock?: boolean) => {
    const showLowStock = max ? max <= 5 : false;
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
          name="quantity"
        />

        <h3 className="text-lg text-red-500 w-full text-left font-bold">
          {`${showLowStock ? "Low on stock" : ""}`}
        </h3>
        <h3
          hidden={errormess.qty.length === 0}
          className="error_mess text-lg text-red-500 font-bold w-full h-full"
        >
          {errormess.qty}
        </h3>
      </div>
    );
  };

  const size = () => {
    const sizedata = prob.details.find((i) => i.info_type === "SIZE")
      ?.info_value as infovaluetype[];
    const data = sizedata.map((i) => i.val);

    return (
      <div className="w-full h-fit flex flex-col gap-y-1">
        <label htmlFor="size" className="text-lg font-bold">
          Size
        </label>
        <Selection
          onChange={handleSelectSize}
          default="Size"
          defaultValue={""}
          data={data}
          style={{ height: "50px", width: "200px", maxWidth: "250px" }}
        />
        {stock(qty)}
      </div>
    );
  };

  const Variant = (
    name: string,
    type: "COLOR" | "TEXT",
    data: string[],
    idx: number
  ) => {
    let orderdetail = { ...productorderdetail } as Productordertype;
    const detail = orderdetail.details
      .filter((i) => i)
      .find((i) => i.option_title === name);
    const selected = detail ? detail.option_value : undefined;

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

  const showOptionandStock = () => {
    const type = prob.stocktype;
    const Productunvaliable = (
      <h3 className="text-lg text-gray-400 font-medium">
        {" "}
        Product Unavaliable{" "}
      </h3>
    );

    return type === "stock" ? (
      prob.stock ? (
        stock(prob.stock, true)
      ) : (
        Productunvaliable
      )
    ) : type === "size" ? (
      size()
    ) : prob.variants ? (
      <>
        {prob.variants.map((i, idx) =>
          Variant(i.option_title, i.option_type, i.option_value, idx)
        )}
        {prob.varaintstock && prob.varaintstock.length !== 0
          ? stock(qty)
          : Productunvaliable}
      </>
    ) : (
      <></>
    );
  };

  const inCartCheck = async (seleteddetail: Array<Productorderdetailtype>) => {
    const checkreq = CheckCart.bind(null, seleteddetail);
    const request = await checkreq();

    if (request.success) {
      setincart(request.incart ?? false);
    }
  };

  const checkallrequireddetail = () => {
    const { stocktype } = prob;
    const { details, quantity } = productorderdetail;

    const ishaveQty = quantity !== 0;
    if (stocktype === "stock") {
      if (!ishaveQty) {
        setmess(
          !ishaveQty
            ? { qty: "Please Select the quantity", option: "" }
            : { option: "", qty: "" }
        );
        return false;
      }
    } else {
      const isSelectedDetails =
        details.filter((i) => i).length !== 0 &&
        details.filter((i) => i).some((i) => i.option_value.length !== 0);

      const isValid = isSelectedDetails && ishaveQty;

      if (!isValid) {
        setmess(
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

    if (!checked) {
      return;
    }

    const addtocart = Addtocart.bind(null, productorderdetail);
    const makerequest = await addtocart();

    if (!makerequest.success) {
      errorToast(makerequest.message ?? "Error Occured");
      return;
    }

    successToast("Added to cart");
    setproductorderdetail((prev) => ({
      ...prev,
      details: [],
      quantity: 0,
      price: { price: 0 },
    }));
    setincart(true);
    router.refresh();
  };

  const handleSelectRelated = () => {};

  const showPrice = () => {
    const isDiscount = prob.discount && (
      <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
        <h3 className="oldprice line-through w-fit font-normal">
          {`$ ${prob.price}`}
        </h3>
        <h3 className="w-fit text-red-400">{`-${prob.discount.percent}%`}</h3>
        <h3 className="w-fit">{`$ ${prob.discount.newPrice}`}</h3>
      </div>
    );
    const normalprice = (
      <h3 className="text-lg font-bold w-full">{`$ ${parseFloat(
        prob.price.toString()
      ).toFixed(2)}`}</h3>
    );

    return isDiscount ? isDiscount : normalprice;
  };

  const ShowRelated = () => {
    return (
      <div className="w-full h-fit grid grid-cols-3 gap-y-5">
        {prob.relatedproduct?.map((related) => (
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
  return (
    <div className="productdetail__container h-full pb-10 pt-5">
      {loading && <ContainerLoading />}
      <section className="product_section flex flex-row w-full h-fit">
        <div className="product_image min-h-[100vh]  grid grid-cols-2 gap-y-2  place-items-start w-full">
          {prob.covers.map((img) => (
            <Image
              key={img.name}
              src={img.url || Default}
              alt={"Cover"}
              className="product_cover w-[450px] h-[550px] object-cover"
              width={1000}
              height={1000}
              loading="lazy"
            />
          ))}
        </div>
        <div className="product_detail  w-3/4 flex flex-col pl-4 gap-y-10 h-fit">
          <h1 className="product_name text-3xl font-bold max-h-[105px] pt-1 break-words overflow-y-auto">
            {" "}
            {prob.name}{" "}
          </h1>
          <h3 className="product_description text-lg font-normal w-full">
            {prob.description ?? "No Description"}
          </h3>
          {showPrice()}

          <label className="text-lg font-bold">Other Version</label>

          {prob.relatedproduct && prob.relatedproduct.length > 0 && (
            <ShowRelated />
          )}

          <div className="w-full h-fit flex flex-col gap-y-5">
            <h3
              hidden={errormess.option.length === 0}
              className="error_mess text-lg text-red-500 font-bold w-full h-full"
            >
              {errormess.option}
            </h3>
            <div className="w-full h-[500px]  overflow-x-hidden pl-3 overflow-y-auto flex flex-col gap-y-5">
              {showOptionandStock()}
            </div>

            <div className="product_action pt-2 flex flex-col items-center gap-y-2">
              <PrimaryButton
                type="submit"
                text={incart ? "In Cart" : "Add To Cart"}
                disable={productorderdetail.quantity === 0 || incart}
                onClick={() => handleCart()}
                color="white"
                textcolor="black"
                border="1px solid black"
                radius="10px"
                width="99%"
              />
              <PrimaryButton
                type="button"
                text="Buy"
                radius="10px"
                width="99%"
              />
            </div>
          </div>

          <div className="w-full h-full flex flex-col justify-start gap-y-2 ">
            <ToggleMenu
              name="Product Detail"
              isAdmin={false}
              data={prob.details.filter((i) => i.info_type !== "SIZE")}
            />

            <ToggleMenu name="Shipping & Return" isAdmin={false} />
          </div>
        </div>
      </section>
      <section className="relatedproduct__section w-full mt-5"></section>
    </div>
  );
}
