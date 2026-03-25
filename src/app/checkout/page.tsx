import {
  BackAndEdit,
  CheckoutSessionTimer,
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
  Ordertype,
  totalpricetype,
  Productorderdetailtype,
  VariantOptionsType,
  VariantPriceBreakdown,
} from "@/src/types/order.type";
import { calculateDiscountProductPrice, decrypt } from "@/src/lib/utilities";
import { checkOrder } from "./action";
import { SuccessVector } from "../component/Asset";
import { getPolicesByPage } from "../api/policy/route";
import Link from "next/link";
import { Metadata } from "next";
import { getCheckoutdata, getVariantPriceBreakDown } from "./fetchaction";
import { Varianttype } from "@/src/types/product.type";
import { Chip } from "@heroui/react";
import { getVariantDetail } from "./helper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout | SrokSre",
    description: "Checkout page , payment with paypal",
  };
}

const STEPS = [1, 2, 3, 4];
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
export default async function Checkoutpage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawStep = Array.isArray(resolvedSearchParams?.step)
    ? resolvedSearchParams.step[0]
    : resolvedSearchParams?.step;
  const rawOrderParam = Array.isArray(resolvedSearchParams?.orderid)
    ? resolvedSearchParams.orderid[0]
    : resolvedSearchParams?.orderid;

  const step = rawStep ? parseInt(rawStep, 10) : 0;
  if (!Number.isInteger(step) || !STEPS.includes(step) || !rawOrderParam) {
    return redirect("/");
  }

  let orderid = "";

  try {
    orderid = decrypt(rawOrderParam, process.env.KEY as string);
  } catch {
    return redirect("/");
  }

  if (!ORDER_ID_PATTERN.test(orderid)) {
    return redirect("/");
  }

  //Verify order validility
  const order = await checkOrder(orderid);

  if (!order) {
    return redirect("/");
  }

  if (step === 4 && order.status !== Allstatus.paid) {
    return redirect("/notfound");
  }

  const bodyContent =
    step === 1 ? (
      <OrderSummary orderId={orderid} />
    ) : step === 2 ? (
      <ShippingForm orderid={orderid} />
    ) : step === 3 ? (
      <PaymentDetail orderId={orderid} encryptedId={rawOrderParam} />
    ) : undefined;

  return (
    <main className="check_page w-full min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
      {step !== 4 && order.status !== Allstatus.paid ? (
        <div className="max-w-7xl mx-auto space-y-8">
          {order.status === Allstatus.unpaid && order.createdAt && (
            <CheckoutSessionTimer
              createdAt={order.createdAt.toISOString()}
              renewedAt={order.renewedAt?.toISOString() ?? null}
              orderId={orderid}
            />
          )}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <StepIndicator step={step} />
          </div>
          <FormWrapper BodyContent={bodyContent} step={step} order_id={orderid}>
            <BackAndEdit step={step} orderId={orderid} />
            <div className="submit-btn w-full pt-1 border-t border-gray-100">
              <Proceedbutton step={step} />
            </div>
          </FormWrapper>
          <Totalprice orderID={orderid as string} />
        </div>
      ) : (
        <SuccessPage orderid={orderid} />
      )}
    </main>
  );
}

export const calculatePrice = async (price: number, percent: number) =>
  price - (price * percent) / 100;

const OrderSummary = async ({ orderId }: { orderId: string }) => {
  const orderData = await getCheckoutdata(orderId);

  if (!orderData) {
    return redirect("/");
  }

  return (
    <div className="checkout_container bg-white w-full max-w-4xl mx-auto rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6 animate-fade-in transition-all duration-300">
      <input type="hidden" name="summary" value={"summary"} />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-linear-to-b from-blue-600 to-blue-400 rounded-full"></div>
        <h3 className="text-3xl font-bold text-gray-800">Order Summary</h3>
      </div>

      <div className="productlist w-full h-full flex flex-col gap-y-6">
        {orderData.Orderproduct.map((order) => {
          const price = order.price;
          const total =
            order.quantity * (price.discount?.newprice ?? price.price);
          if (!order.product) return null;

          return (
            <Checkoutproductcard
              key={order.id}
              qty={order.quantity}
              cover={order.product.covers[0].url}
              price={price}
              total={total}
              name={order.product.name}
              details={order.selectedvariant}
            />
          );
        })}
      </div>
    </div>
  );
};

const PaymentDetail = async ({
  orderId,
  encryptedId,
}: {
  orderId: string;
  encryptedId: string;
}) => {
  const order = await getCheckoutdata(orderId);

  if (!order || order.status !== Allstatus.unpaid) {
    return notFound();
  }

  return (
    <div className="checkout_container bg-white w-full max-w-4xl mx-auto rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6 animate-fade-in transition-all duration-300">
      <input type="hidden" value={"payment"} name="payment" />
      <div className="w-full h-fit flex flex-col gap-y-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-linear-to-b from-green-600 to-green-400 rounded-full"></div>
          <h1 className="text-3xl font-bold text-gray-800">
            Payment Information
          </h1>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
              1
            </span>
            Shipping Services
          </h3>

          <div className="shipping_service w-full h-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(order.shipping_id
              ? Shippingservice
              : Shippingservice.filter((i) => i.value === "Pickup")
            ).map((i) => (
              <Shippingservicecard
                key={i.value}
                orderId={orderId}
                isSelected={
                  !order.shipping_id ? true : order.shippingtype === i.value
                }
                disabled={!order.shipping_id}
                {...i}
              />
            ))}
          </div>

          <div className="Payment_method w-full flex flex-col gap-y-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">
                2
              </span>
              Payment Method
            </h3>
            <div className="paypal_button w-full max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
              <Paypalbutton
                encripyid={encryptedId}
                order={order as Ordertype}
                orderId={orderId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getOrderTotal = async (orderID: string) => {
  try {
    let result = (await Prisma.orders.findUnique({
      where: { id: orderID },
      select: {
        price: true,
        Orderproduct: {
          select: {
            quantity: true,
            product: {
              select: {
                price: true,
                discount: true,
              },
            },
          },
        },
      },
    })) as unknown as Ordertype;

    if (!result || !result.price) {
      return null;
    }

    return {
      ...result.price,
      total: result?.price.total as never,
      subtotal: result?.Orderproduct.reduce((subtotal, i) => {
        const unitPrice = i?.product?.discount
          ? calculateDiscountProductPrice({
              price: i.product.price,
              discount: i.product?.discount as never,
            }).discount?.newprice
          : i.product?.price;

        return subtotal + (unitPrice ?? 0) * i.quantity;
      }, 0),
    } as totalpricetype;
  } catch {
    return null;
  }
};

/**
 *
 * @param orderId
 * @returns
 */
const getVariantPriceBreakdownByOrderId = async (
  orderId: string,
): Promise<VariantPriceBreakdown[]> => {
  const orderData = await getVariantPriceBreakDown(orderId);
  if (!orderData || orderData.Orderproduct.length === 0) return [];

  const breakdown: VariantPriceBreakdown[] = [];

  orderData.Orderproduct.forEach((orderProduct) => {
    if (!orderProduct.product || !orderProduct.details) return;
    const selectedVariant = orderProduct.details as Productorderdetailtype[];

    if (selectedVariant.length) {
      const pricebreakDownSelectedVariants: Array<VariantOptionsType | null> =
        selectedVariant.map((i) => {
          const isVariant = orderProduct.product.Variant.find(
            (variant) => variant.id === i.variant_id,
          );

          if (!isVariant) return null;

          return getVariantDetail({
            val: i.value,
            productvariant: isVariant as Varianttype,
          });
        });

      breakdown.push({
        productName: orderProduct.product.name,
        quantity: orderProduct.quantity,
        variantOptions: pricebreakDownSelectedVariants.filter(
          Boolean,
        ) as Array<VariantOptionsType>,
      });
    }
  });

  return breakdown;
};

const convertprice = (price: number) => `$${price.toFixed(2)}`;

async function Totalprice({ orderID }: { orderID: string }) {
  const [total, variantBreakdown] = await Promise.all([
    getOrderTotal(orderID),
    getVariantPriceBreakdownByOrderId(orderID),
  ]);

  const totalVariantPrice = variantBreakdown.reduce(
    (sum, product) =>
      sum +
      product.variantOptions.reduce((pSum, option) => pSum + option.price, 0) *
        (product.quantity ?? 1),
    0,
  );

  return (
    <div className="price_container w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Subtotal</span>
          <span className="text-lg font-semibold text-gray-800">
            {total?.subtotal ? convertprice(total.subtotal) : "$0.00"}
          </span>
        </div>

        {variantBreakdown.length > 0 && (
          <div className="variant-breakdown py-3 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Variant Options</span>
              <span className="text-lg font-semibold text-gray-800">
                {convertprice(totalVariantPrice)}
              </span>
            </div>
            <div className="ml-4 space-y-2">
              {variantBreakdown.map((product, pIdx) => (
                <div key={pIdx} className="space-y-3">
                  <div className="text-sm text-gray-500 font-medium">
                    {product.productName}
                    {(product.quantity ?? 1) > 1 && (
                      <span className="text-gray-400 font-normal ml-1">
                        ×{product.quantity}
                      </span>
                    )}
                  </div>
                  {product.variantOptions.map((option, oIdx) => (
                    <div
                      key={oIdx}
                      className="flex justify-between items-center text-sm pl-4"
                    >
                      <span className="text-gray-500">
                        •{" "}
                        {typeof option.name === "string" ? (
                          option.name
                        ) : (
                          <Chip
                            color="default"
                            variant="bordered"
                            size="lg"
                            startContent={
                              <span
                                className={`w-4.5 h-4.5 rounded-full`}
                                style={{
                                  backgroundColor: option.name.val,
                                }}
                              ></span>
                            }
                          >
                            {option.name?.name || option.name?.val}
                          </Chip>
                        )}
                      </span>
                      <span className="text-gray-600">
                        {convertprice(option.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Shipping Fee</span>
          <span className="text-lg font-semibold text-gray-800">
            {total?.shipping ? convertprice(total.shipping) : "$0.00"}
          </span>
        </div>
        <div className="flex justify-between items-center py-4 mt-4 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl px-6">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {total?.total ? convertprice(total.total) : "$0.00"}
          </span>
        </div>
      </div>
    </div>
  );
}

const SuccessPage = async ({ orderid }: { orderid: string }) => {
  const policy = await getPolicesByPage("checkout");

  return (
    <div className="success_page w-full max-w-5xl mx-auto mt-8 flex flex-col items-center gap-y-12 px-4">
      <div className="header w-full flex flex-row items-center justify-center">
        <div className="hidden md:block flex-1 h-1 bg-linear-to-r from-transparent to-green-500 rounded-full"></div>
        <div className="content px-8 py-6 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-2xl md:text-3xl font-bold text-center whitespace-nowrap">
            Thank you for your purchase! 🎉
          </h2>
        </div>
        <div className="hidden md:block flex-1 h-1 bg-linear-to-l from-transparent to-green-500 rounded-full"></div>
      </div>
      <div className="order_detail w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12 flex flex-col gap-y-8 items-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <SuccessVector />
        </div>

        <div className="w-full flex flex-col gap-y-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
            {`Order #${orderid}`}
          </h3>
          <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-50 rounded-full w-fit mx-auto">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-lg font-semibold text-green-700">
              Paid and preparing for shipping
            </p>
          </div>
          <p className="text-base text-gray-600">
            Receipt sent to your registered email.
          </p>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors duration-200"
                href={`/privacyandpolicy?p=0`}
              >
                Questions
              </Link>
              {policy.map((pol) => (
                <Link
                  key={pol.id}
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
                  href={`/privacyandpolicy?p=${pol.id}`}
                >
                  {pol.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer_detail flex flex-col gap-y-6 w-full bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
        <p className="text-lg font-medium text-gray-700 text-center">
          Any Problem? Please{" "}
          <span className="text-blue-600 font-semibold">
            contact us via email
          </span>
        </p>
        <div className="max-w-md mx-auto w-full">
          <Navigatebutton
            title="View Order Details"
            to={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?&q=${orderid}`}
          />
        </div>
      </div>
    </div>
  );
};
