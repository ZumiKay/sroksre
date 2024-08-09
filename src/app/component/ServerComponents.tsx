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

  let orderdetailvalue = orderdetail.map((i) => i.option_value).filter(Boolean);

  variantstock.forEach((i) => {
    const varaint_val = i.variant_val.filter((val) => val !== "null");

    if (
      varaint_val.length === orderdetailvalue.length &&
      varaint_val.every((val) => orderdetailvalue.includes(val))
    ) {
      totalqty = i.qty;
      id = i.id as number;
    }
  });

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
