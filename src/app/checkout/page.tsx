"use server";

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
  Ordertype,
  Productorderdetailtype,
  Productordertype,
  ShippingTypeEnum,
  totalpricetype,
  OrderSelectedVariantType,
} from "@/src/types/order.type";
import { calculateDiscountProductPrice, decrypt } from "@/src/lib/utilities";
import { checkOrder } from "./action";
import { SuccessVector } from "../component/Asset";
import { getPolicesByPage } from "../api/policy/route";
import Link from "next/link";
import { Metadata } from "next";
import {
  VariantValueObjType,
  VariantSectionType,
} from "@/src/types/product.type";
import { userdata } from "../account/actions";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout | SrokSre",
    description: "Checkout page , payment with paypal",
  };
}
export default async function Checkoutpage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const step = resolvedSearchParams?.step
    ? parseInt(resolvedSearchParams?.step as string)
    : 0;
  const orderid_param = resolvedSearchParams?.orderid;
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
    <main className="check_page w-full min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
      {step !== 4 && order.status !== Allstatus.paid ? (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <StepIndicator step={step} />
          </div>
          <FormWrapper step={step} order_id={orderid}>
            <BackAndEdit step={step} />
            <ShowBody />
            <div className="submit-btn w-full max-w-xs max-small_tablet:max-w-full">
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

/** Get Specific Order Details
 * @param orderid
 * @param userid
 * @returns order with user details
 */

export const getCheckoutdata = async (
  orderid?: string,
  userid?: string,
): Promise<Ordertype | null> => {
  const result = await Prisma.orders.findFirst({
    where: userid ? { user: { buyer_id: userid } } : { id: orderid },
    include: {
      user: {
        select: {
          id: true,
          buyer_id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
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
              //Variant with variant section
              Variant: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  option_value: true,
                  variantSection: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const updatedOrderProducts: Array<Productordertype> = result.Orderproduct.map(
    (orderProduct) => {
      {
        const detail = orderProduct.details as Productorderdetailtype[];
        const hasVariantSection = orderProduct.product.Variant.some(
          (variant) => variant.variantSection,
        );

        let selectedVariantDetails:
          | Array<string | VariantValueObjType>
          | OrderSelectedVariantType;

        if (hasVariantSection) {
          // Grouped by variant sections
          const sectionMap = new Map<
            number | null,
            Array<string | VariantValueObjType>
          >();
          const sectionInfoMap = new Map<number, any>();

          orderProduct.product.Variant.forEach((variant, idx) => {
            const detailValue = detail[idx].value;
            const optionValues = variant.option_value as (
              | string
              | VariantValueObjType
            )[];

            const matchedValue = optionValues.find((val) =>
              typeof val === "string"
                ? val === detailValue
                : val.val === detailValue,
            );

            if (matchedValue) {
              const sectionId = variant.variantSection?.id ?? null;
              if (!sectionMap.has(sectionId)) {
                sectionMap.set(sectionId, []);
              }
              sectionMap.get(sectionId)!.push(matchedValue);

              if (sectionId && variant.variantSection) {
                sectionInfoMap.set(sectionId, variant.variantSection);
              }
            }
          });

          const variantsection: Array<{
            variantSection: Partial<VariantSectionType>;
            variants: Array<string | VariantValueObjType>;
          }> = [];
          const variant: Array<string | VariantValueObjType> = [];

          sectionMap.forEach((variants, sectionId) => {
            if (sectionId) {
              variantsection.push({
                variantSection: sectionInfoMap.get(sectionId),
                variants,
              });
            } else {
              variant.push(...variants);
            }
          });

          selectedVariantDetails = {
            variantsection:
              variantsection.length > 0 ? variantsection : undefined,
            variant: variant.length > 0 ? variant : undefined,
          };
        } else {
          // No sections - return flat array
          selectedVariantDetails = orderProduct.product.Variant.map(
            (variant, idx) => {
              const detailValue = detail[idx].value;
              const optionValues = variant.option_value as (
                | string
                | VariantValueObjType
              )[];

              return optionValues.find((val) =>
                typeof val === "string"
                  ? val === detailValue
                  : val.val === detailValue,
              );
            },
          ).filter(Boolean) as Array<string | VariantValueObjType>;
        }

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
        } as unknown as Productordertype; //Ignore JSONValue type
      }
    },
  );

  return {
    ...result,
    user: result.user as userdata,
    shipping: result.shipping ?? undefined,
    shippingtype: result.shippingtype as ShippingTypeEnum,
    estimate: result.estimate ?? undefined,
    price: result.price as unknown as totalpricetype,
    status: result.status as Allstatus,
    shipping_id: result.shipping_id ?? undefined,
    Orderproduct: updatedOrderProducts,
  };
};

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
          return order.product ? (
            <Checkoutproductcard
              key={order.id}
              qty={order.quantity}
              cover={order.product.covers[0].url}
              price={price}
              total={total}
              name={order.product.name}
              details={order.selectedvariant}
            />
          ) : (
            <></>
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
            {(order?.shipping_id
              ? Shippingservice
              : Shippingservice.filter((i) => i.value === "Pickup")
            ).map((i, idx) => (
              <Shippingservicecard
                key={idx}
                orderId={orderId}
                isSelected={
                  shipping ? shipping.shippingtype === i.value : false
                }
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
    <div className="price_container w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Subtotal</span>
          <span className="text-lg font-semibold text-gray-800">
            {total?.subtotal ? convertprice(total.subtotal) : "$0.00"}
          </span>
        </div>
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
