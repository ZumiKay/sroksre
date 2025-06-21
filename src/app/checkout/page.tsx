"use server";
import { Shippingservice } from "@/src/context/Checkoutcontext";
import { notFound, redirect } from "next/navigation";
import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productorderdetailtype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { calculateDiscountPrice, decrypt } from "@/src/lib/utilities";
import { checkOrder } from "./action";
import { SuccessVector } from "../component/Asset";
import { getPolicesByPage } from "../api/policy/route";
import Link from "next/link";
import { Metadata } from "next";
import {
  DiscountpriceType,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import {
  FormWrapper,
  ShippingForm,
} from "../component/Checkout/Form_Component";
import {
  Checkoutproductcard,
  Shippingservicecard,
  StepIndicator,
} from "../component/Checkout/Component";
import {
  BackAndEdit,
  Navigatebutton,
  Proceedbutton,
} from "../component/Checkout/Button";
import { Paypalbutton } from "../component/PayPalButton";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout | SrokSre",
    description: "Checkout page , payment with paypal",
  };
}
export default async function Checkoutpage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const step = searchParams?.step ? parseInt(searchParams?.step as string) : 0;
  const orderid_param = searchParams?.orderid;
  if (!step || !orderid_param || orderid_param.length === 0) {
    return redirect("/");
  }

  const orderid = decrypt(orderid_param as string, process.env.KEY as string);

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
            <div className="submit-btn w-[150px] max-small_tablet:w-full h-fit">
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

const getCheckoutdata = async (orderid?: string, userid?: number) => {
  const result = await Prisma.orders.findFirst({
    where: userid ? { user: { id: userid } } : { id: orderid },
    include: {
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
      shipping: true,
      Orderproduct: {
        include: {
          product: {
            select: {
              id: true,
              covers: true,
              discount: true,
              name: true,
              price: true,
              stocktype: true,
              Stock: { select: { Stockvalue: true } },
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
        product: {
          ...orderProduct.product,
          discount:
            orderProduct.product.discount &&
            calculateDiscountPrice(
              orderProduct.product.price,
              orderProduct.product.discount
            ),
        },
      };
    }
  });

  return {
    ...result,
    Orderproduct: updatedOrderProducts,
  };
};

const OrderSummary = async ({ orderId }: { orderId: string }) => {
  const orderData = await getCheckoutdata(orderId);

  if (!orderData) {
    return redirect("/");
  }

  return (
    <div
      className={`checkout_container bg-[#F1F1F1] w-[50vw] h-fit p-2 
    max-smaller_screen:w-full
    rounded-lg shadow-lg 
    animate-fade-in`}
    >
      <input type="hidden" name="summary" value={"summary"} />
      <h3 className="title text-2xl font-bold pb-5">Order Summary</h3>

      <div className="productlist w-full h-full flex flex-col gap-y-5 p-2">
        {orderData.Orderproduct.map((order) => {
          const prod = order.product;
          const isDiscount = prod.discount as DiscountpriceType | undefined;
          const total =
            order.quantity *
            (isDiscount ? Number(isDiscount.newprice) : prod.price);

          return (
            <Checkoutproductcard
              key={order.id}
              qty={order.quantity}
              cover={order.product.covers[0].url}
              total={total}
              price={{
                price: order.product.price,
                discount: isDiscount as never,
              }}
              name={order.product.name}
              details={order.selectedvariant as never}
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
    <div className="checkout_container bg-[#F1F1F1] w-[50vw] max-smaller_screen:w-full h-fit p-2 rounded-lg shadow-lg animate-fade-in">
      <input type="hidden" value={"payment"} name="payment" />
      <div className="w-full h-fit bg-white flex flex-col gap-y-5 items-center p-2">
        <h1 className="text-3xl font-medium w-full text-start h-fit">
          Payment Information
        </h1>

        <h3 className="text-xl w-full font-normal h-fit text-left">
          Shipping Services
        </h3>

        <div className="shipping_service w-full h-fit flex flex-row gap-3 flex-wrap justify-center">
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
              order={order as unknown as Ordertype}
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
    const result = await Prisma.orders.findUnique({
      where: { id: orderID },
      select: { price: true },
    });

    return result?.price as unknown as totalpricetype;
  } catch (error) {
    console.log("fetch Total", error);
    return null;
  }
};
const convertprice = (price: number) => `$${price.toFixed(2)}`;
async function Totalprice({ orderID }: { orderID: string }) {
  const total = await getOrderTotal(orderID);

  return (
    <div className="price_container w-[50vw] max-smaller_screen:w-[80%] p-2 h-[200px] flex flex-row justify-between items-center  mt-10 border-t-2 border-dashed border-t-black">
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
    <div className="success_page w-full min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Animated Header */}
      <div className="header w-full max-w-4xl mb-12 relative">
        <div className="flex items-center justify-center relative">
          <div className="flex-1 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-70"></div>
          <div className="mx-4 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
            <span className="text-xl font-bold whitespace-nowrap">
              🎉 Thank you for your purchase!
            </span>
          </div>
          <div className="flex-1 h-2 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-70"></div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="order_detail w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transform hover:shadow-3xl transition-all duration-300">
        {/* Success Icon */}
        <div className="flex justify-center mb-8 animate-bounce">
          <div className="p-4 bg-green-100 rounded-full">
            <SuccessVector />
          </div>
        </div>

        {/* Order Info */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-800 leading-tight">
              Order #{orderid}
            </h2>
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Paid & Preparing for Shipping
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-lg text-gray-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Receipt sent to your registered email
            </p>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Need Help?
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                href="/privacyandpolicy?p=0"
                prefetch={false}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                FAQ
              </Link>
              {policy.map((pol) => (
                <Link
                  key={pol.id}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  href={`/privacyandpolicy?p=${pol.id}`}
                  prefetch={false}
                >
                  {pol.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="footer_detail mt-8 w-full max-w-2xl space-y-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4 flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Have questions? Contact us via email
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Navigatebutton
            title="📦 View Order Details"
            to={`/dashboard/order?q=${orderid}`}
          />
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
