import Prisma from "@/src/lib/prisma";
import {Productorderdetailtype} from "@/src/context/OrderContext";
import {VariantColorValueType} from "@/src/context/GlobalType.type";
import {calculateDiscountProductPrice} from "@/src/lib/utilities";

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

export default  getCheckoutdata;