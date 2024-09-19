import Prisma from "@/src/lib/prisma";
import { Stocktype } from "@/src/context/GlobalContext";
import "../globals.css";
import {
  Allstatus,
  getUser,
  Productorderdetailtype,
} from "@/src/context/OrderContext";

//Helper functions
export const ProductStockType = {
  size: "size",
  variant: "variant",
  stock: "stock",
};

export const getQtyBasedOnOptions = (
  variantstock: Stocktype[],
  orderdetail: Productorderdetailtype[]
) => {
  let totalqty = 0;
  let id = 0;

  const orderdetailValuesSet = new Set(
    orderdetail.map((i) => i.option_value).filter(Boolean)
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
        totalqty = variant.qty;
        id = stock.id ?? 0;
      }
    }
  }

  return { totalqty, id };
};

export async function CartIndicator() {
  const user = await getUser();

  const getCartitem = async () => {
    if (!user) {
      return 0;
    }
    const cartitem = await Prisma.orderproduct.count({
      where: {
        user_id: user.id,
        status: { in: [Allstatus.incart, Allstatus.unpaid] },
      },
    });

    return cartitem;
  };

  const cartitem = await getCartitem();

  return (
    <span className="text-[13px] w-[20px] h-[20px] grid place-content-center absolute -bottom-6 top-0 -right-3 bg-gray-500 text-white rounded-[50%]">
      {cartitem}
    </span>
  );
}
