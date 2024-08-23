import React from "react";
import {
  BackAndEdit,
  Checkoutproductcard,
  FormWrapper,
  Navigatebutton,
  Paypalbutton,
  Proceedbutton,
  ShippingForm,
  Shippingservicecard,
  StepIndicator,
} from "../component/Checkout";
import { Shippingservice } from "@/src/context/Checkoutcontext";
import { notFound, redirect } from "next/navigation";
import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Productorderdetailtype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { calculateDiscountProductPrice, decrypt } from "@/src/lib/utilities";
import { checkOrder, OrderUserType } from "./action";
import { SuccessVector } from "../component/Asset";
import { VariantColorValueType } from "@/src/context/GlobalContext";
import { getPolicesByPage } from "../api/policy/route";
import Link from "next/link";

export default async function Checkoutpage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const step = searchParams?.step ? parseInt(searchParams?.step as string) : 0;
  const orderid_param = searchParams?.orderid;
  if (!step || !orderid_param || orderid_param.length === 0) {
    return redirect("/");
  }

  let orderid = decrypt(orderid_param as string, process.env.KEY as string);

  const order = await checkOrder(orderid);

  if (!order) {
    return redirect("/");
  }

  const ShowBody = () => {
    return step === 1 ? (
      <OrderSummary orderId={orderid} />
    ) : step === 2 ? (
      <ShippingForm orderid={orderid} />
    ) : step === 3 ? (
      <PaymentDetail orderId={orderid} encryptedId={orderid_param as string} />
    ) : (
      <></>
    );
  };

  return (
    <main className="check_page w-full min-h-screen m-0 flex flex-col gap-y-10 items-center">
      {step !== 4 && order.status !== Allstatus.paid ? (
        <>
          <StepIndicator step={step} />
          <FormWrapper step={step} order_id={orderid}>
            <BackAndEdit step={step} />
            <ShowBody />
            <div className="submit-btn w-[150px] h-fit">
              <Proceedbutton step={step} />
            </div>
          </FormWrapper>
          <Totalprice orderID={orderid as string} />
        </>
      ) : (
        <SuccessPage orderid={orderid} />
      )}
    </main>
  );
}

//Component

export const getCheckoutdata = async (orderid?: string, userid?: number) => {
  const result = await Prisma.orders.findFirst({
    where: userid ? { user: { id: userid } } : { id: orderid },
    include: {
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
      Orderproduct: {
        include: {
          product: {
            select: {
              covers: true,
              discount: true,
              name: true,
              price: true,
              Variant: {
                orderBy: { id: "asc" },
                select: { id: true, option_value: true },
              },
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const updatedOrderProducts = result.Orderproduct.map((orderProduct) => {
    {
      const detail = orderProduct.details as Productorderdetailtype[];
      const selectedVariantDetails = orderProduct.product.Variant.map(
        (variant, idx) => {
          const detailValue = detail[idx].value;
          const optionValues = variant.option_value as (
            | string
            | VariantColorValueType
          )[];

          return optionValues.find((val) =>
            typeof val === "string"
              ? val === detailValue
              : val.val === detailValue
          );
        }
      ).filter(Boolean);

      return {
        ...orderProduct,
        selectedvariant: selectedVariantDetails,
        price: calculateDiscountProductPrice({
          price: orderProduct.product.price,
          discount: orderProduct.product.discount ?? undefined,
        }),
        product: {
          ...orderProduct.product,
        },
      };
    }
  });

  return {
    ...result,
    Orderproduct: updatedOrderProducts,
  };
};

export const calculatePrice = (price: number, percent: number) =>
  price - (price * percent) / 100;

const OrderSummary = async ({ orderId }: { orderId: string }) => {
  const orderData = await getCheckoutdata(orderId);

  if (!orderData) {
    return redirect("/");
  }

  return (
    <div className="checkout_container bg-[#F1F1F1] w-[50vw] h-fit p-2 rounded-lg shadow-lg animate-fade-in">
      <input type="hidden" name="summary" value={"summary"} />
      <h3 className="title text-2xl font-bold pb-5">Order Summary</h3>

      <div className="productlist w-full h-full flex flex-col gap-y-5 p-2">
        {orderData.Orderproduct.map((order) => {
          const price = order.price;
          const total =
            order.quantity * (price.discount?.newprice ?? price.price);
          return (
            <Checkoutproductcard
              key={order.id}
              qty={order.quantity}
              cover={order.product.covers[0].url}
              price={price}
              total={total}
              name={order.product.name}
              details={order.selectedvariant as any}
            />
          );
        })}
      </div>
    </div>
  );
};

const getShippingtype = async (orderId: string) => {
  const order = await Prisma.orders.findUnique({
    where: { id: orderId },
    select: { shippingtype: true, status: true },
  });

  return order;
};

const PaymentDetail = async ({
  orderId,
  encryptedId,
}: {
  orderId: string;
  encryptedId: string;
}) => {
  const shipping = await getShippingtype(orderId);
  const order = await getCheckoutdata(orderId);

  if (shipping?.status !== Allstatus.unpaid) {
    return notFound();
  }

  return (
    <div className="checkout_container bg-[#F1F1F1] w-[50vw] h-fit p-2 rounded-lg shadow-lg animate-fade-in">
      <input type="hidden" value={"payment"} name="payment" />
      <div className="w-full h-fit bg-white flex flex-col gap-y-5 items-center p-2">
        <h1 className="text-3xl font-medium w-full text-start h-fit">
          Payment Information
        </h1>

        <h3 className="text-xl w-full font-normal h-fit text-left">
          Shipping Services
        </h3>

        <div className="shipping_service w-full h-fit grid grid-cols-3 gap-x-5 place-items-center">
          {(order?.shipping_id
            ? Shippingservice
            : Shippingservice.filter((i) => i.value === "Pickup")
          ).map((i, idx) => (
            <Shippingservicecard
              key={idx}
              orderId={orderId}
              isSelected={shipping ? shipping.shippingtype === i.value : false}
              {...i}
            />
          ))}
        </div>

        <div className="Payment_method w-full flex flex-col items-center gap-y-5">
          <h3 className="text-xl w-full h-fit font-normal text-left">
            Payment Method
          </h3>
          <div className="paypal_button w-[80%] h-fit relative">
            <Paypalbutton
              encripyid={encryptedId}
              order={order as unknown as OrderUserType}
              orderId={orderId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const getOrderTotal = async (orderID: string) => {
  try {
    let result = await Prisma.orders.findUnique({
      where: { id: orderID },
      select: { price: true },
    });

    return result?.price as unknown as totalpricetype;
  } catch (error) {
    return null;
  }
};
const convertprice = (price: number) => `$${price.toFixed(2)}`;
async function Totalprice({ orderID }: { orderID: string }) {
  const total = await getOrderTotal(orderID);

  return (
    <div className="price_container w-[50vw] p-2 h-[200px] flex flex-row justify-between items-center  mt-10 border-t-2 border-dashed border-t-black">
      <ul className="price-tag list-none w-fit h-fit flex flex-col gap-y-5 self-end">
        <li>Subtotal</li>
        <li>Shipping Fee</li>
        <li className="mt-5 font-bold">Total</li>
      </ul>
      <ul className="value list-none w-fit h-fit flex flex-col gap-y-5 self-end">
        <li>{total?.subtotal ? convertprice(total.subtotal) : "0.00"}</li>
        <li>{total?.shipping ? convertprice(total.shipping) : "0.00"}</li>
        <li className="mt-5 font-bold">
          {total?.total ? convertprice(total.total) : "0.00"}
        </li>
      </ul>
    </div>
  );
}

const SuccessPage = async ({ orderid }: { orderid: string }) => {
  const policy = await getPolicesByPage("checkout");

  return (
    <div className="success_page w-full h-full mt-5 flex flex-col items-center gap-y-20">
      <div className="header w-full h-[50px] flex flex-row items-center justify-start">
        <div className="line1 w-[50%] h-[10px] bg-[#495464] text-[#495464]"></div>
        <div className="content w-[40%]  p-4 bg-[#495464] text-white rounded-lg text-xl font-bold text-center">
          Thank for your purchase
        </div>
        <div className="line1 w-1/2 h-[10px] bg-[#495464] text-xs text-[#495464]"></div>
      </div>
      <div className="order_detail w-[30%] h-fit flex flex-col gap-y-10 items-center">
        <SuccessVector />

        <div className="w-full h-fit flex flex-col gap-y-5">
          <h3 className="text-2xl font-bold w-full h-fit">
            {`Order #${orderid} is paid and prepare for shipping`}
          </h3>
          <p className="text-lg font-medium w-full h-fit">
            Receipt sent to your registered email.
          </p>
          <h3 className="text-2xl font-bold">Need Help ?</h3>
          <div className="w-full h-fit flex flex-row items-center gap-5 flex-wrap">
            <Link className="text-lg font-bold" href={`/privacyandpolicy?p=0`}>
              Questions
            </Link>
            {policy.map((pol) => (
              <Link
                key={pol.id}
                className="text-lg font-bold"
                href={`/privacyandpolicy?p${pol.id}`}
              >
                {pol.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="footer_detail flex flex-col gap-y-5 w-[30%]">
        <p className="text-lg font-medium text-blue-500 cursor-pointer transition hover:text-white">
          Any Problem? Please contact us via email
        </p>
        <Navigatebutton
          title="View Order"
          to={`${process.env.BASE_URL}/dashboard/order?&q=${orderid}`}
        />
      </div>
    </div>
  );
};
