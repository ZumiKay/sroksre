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
  VariantColorValueType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useEffect, useState } from "react";
import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "@/src/app/component/Loading";
import {
  Addtocart,
  AddWishlist,
  CheckCart,
  Checkwishlist,
  getRelatedProduct,
} from "./action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/src/app/component/Card";
import { ShowPrice } from "./Component";

interface productdetailprops {
  params: { id: number };
  isAdmin?: boolean;
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

const Productdetailinitialize: Productordertype = {
  id: 0,
  details: [],
  quantity: 0,
  price: { price: 0 },
};

export default function ProductDetail({ params, isAdmin }: productdetailprops) {
  const { setcarttotal } = useGlobalContext();
  const [productorderdetail, setproductorderdetail] =
    useState<Productordertype>(Productdetailinitialize);
  const [prob, setprob] = useState<ProductState>(Productinitailizestate);
  const [loading, setloading] = useState(true);
  const [incart, setincart] = useState(false);
  const [qty, setqty] = useState(0);
  const [errormess, setmess] = useState(errormessInitialize);
  const [selectloading, setselectloading] = useState(false);
  const [isInWishlist, setisInWishlist] = useState(false);

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
      errorToast("Error Connection");
      return;
    }

    const checkcart = CheckCart.bind(null, undefined, params.id);
    const checkwishlist = Checkwishlist.bind(null, params.id);
    const [cartResult, wishlistResult] = await Promise.all([
      checkcart(),
      checkwishlist(),
    ]);

    if (!cartResult.success || !wishlistResult) {
      errorToast("Error connection");
      return;
    }

    setincart(cartResult.incart as boolean);
    setisInWishlist(wishlistResult.isExist);

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

  useEffectOnce(() => {
    fetchproductdetail();
  });

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
    const maxqty = prob.varaintstock
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

    if (maxqty) {
      await inCartCheck(
        orderDetail.details.filter((i) => i && i.value.length !== 0)
      );
    }
    setmess(mess);
    setqty(maxqty);
    setproductorderdetail(orderDetail);
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
          value={productorderdetail.quantity}
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

  const Variant = (
    id: number,
    name: string,
    type: "COLOR" | "TEXT",
    data: (string | VariantColorValueType)[],
    idx: number
  ) => {
    let orderdetail = { ...productorderdetail } as Productordertype;
    const detail = orderdetail.details
      ?.filter((i) => i)
      .find((i) => i.variant_id === id);
    const selected = detail ? detail.value : undefined;

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

  const ShowOptionandStock = () => {
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
    ) : prob.variants ? (
      <>
        {prob.variants.map((i, idx) =>
          Variant(i.id ?? 0, i.option_title, i.option_type, i.option_value, idx)
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
    setselectloading(true);
    const checkreq = CheckCart.bind(null, seleteddetail);

    const request = await checkreq();

    setselectloading(false);

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
        details &&
        details.filter((i) => i).length !== 0 &&
        details.filter((i) => i).some((i) => i.value.length !== 0);

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
    setcarttotal((prev) => prev + 1);
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

  const handleWishlist = async () => {
    const makereq = AddWishlist.bind(null, prob.id ?? 0);

    const added = await makereq();
    if (!added.success) {
      errorToast(added.message);
      return;
    }

    successToast(added.message);
  };

  return (
    <div className="productdetail__container h-full pt-5">
      {loading && <ContainerLoading />}
      <div className="product_section flex flex-row w-full h-fit">
        <div className="product_image h-fit  grid grid-cols-2 gap-y-2  place-items-start w-full">
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
          <h3 className="product_name text-3xl font-bold max-h-[105px] pt-1 break-words overflow-y-auto">
            {" "}
            {prob.name}{" "}
          </h3>
          <h3 className="product_description text-lg font-normal w-full">
            {prob.description ?? "No Description"}
          </h3>
          <ShowPrice price={prob.price} discount={prob.discount} />

          {prob.relatedproduct && prob.relatedproduct.length > 0 && (
            <>
              <label className="text-lg font-bold">Other Version</label>
              <ShowRelated />
            </>
          )}

          <div className="w-full h-fit flex flex-col gap-y-5">
            <h3 className="error_mess text-lg text-red-500 font-bold w-full h-full">
              {errormess.option}
            </h3>
            <div className="w-full h-fit  overflow-x-hidden pl-3 overflow-y-auto flex flex-col gap-y-5">
              <ShowOptionandStock />
            </div>

            <div className="product_action pt-2 flex flex-col items-center gap-y-2">
              <PrimaryButton
                type="submit"
                text={incart ? "In Cart" : "Add To Cart"}
                disable={productorderdetail.quantity === 0 || incart || isAdmin}
                onClick={() => handleCart()}
                status={selectloading ? "loading" : "authenticated"}
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

          <div className="w-full h-full flex flex-col justify-start gap-y-2 ">
            <ToggleMenu
              name="Product Detail"
              isAdmin={false}
              data={prob.details.filter((i) => i.info_type !== "SIZE")}
            />

            <ToggleMenu name="Shipping & Return" isAdmin={false} />
          </div>
        </div>
      </div>
      <div className="relatedproduct__section w-full h-full mt-10 flex flex-col items-center gap-y-10">
        <ShowSimilarProduct
          pid={params.id}
          parent_id={prob.category.parent_id}
          child_id={prob.category.child_id}
          promoid={prob.promotion_id}
        />
      </div>
    </div>
  );
}

export const ShowSimilarProduct = ({
  pid,
  parent_id,
  child_id,
  promoid,
}: {
  pid: number;
  parent_id: number;
  child_id?: number;
  promoid?: number;
}) => {
  const [relatedproduct, setrelatedproduct] = useState<
    ProductState[] | undefined
  >(undefined);
  const [limit, setlimit] = useState(3);
  const [isLimit, setisLimit] = useState(false);
  const [loading, setloading] = useState(false);

  const handlegetrelatedproduct = async () => {
    setloading(true);
    const getreq = getRelatedProduct.bind(
      null,
      parseInt(pid.toString()),
      parent_id,
      limit,
      child_id,
      promoid
    );

    const res = await getreq();
    setloading(false);
    if (res.success) {
      setrelatedproduct(res.data);
      if (res.maxprod) {
        setisLimit(res.maxprod);
      }
    }
  };
  useEffect(() => {
    handlegetrelatedproduct();
  }, [limit, parent_id, child_id, pid]);

  return (
    <>
      {relatedproduct && (
        <>
          <h3 className="text-lg font-bold w-full h-fit text-left pl-2">
            You might also like:
          </h3>
          <div className="w-full h-fit grid grid-cols-3 gap-x-5 gap-y-32 p-5">
            {loading && <ContainerLoading />}
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
          {!isLimit && (
            <PrimaryButton
              type="button"
              text="Load more"
              radius="10px"
              width="50%"
              height="40px"
              style={{ marginTop: "100px" }}
              onClick={() => setlimit((prev) => prev + 3)}
            />
          )}
        </>
      )}
    </>
  );
};
