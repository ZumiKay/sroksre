"use client";

import { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Checkoutproductcard } from "@/src/app/component/Checkout";
import { Productordertype } from "@/src/types/order.type";

interface OrderProductDetailsModalProps {
  close: string;
  setclose: () => void;
  data: Productordertype[];
}

export const OrderProductDetailsModal = ({
  close,
  setclose,
  data,
}: OrderProductDetailsModalProps) => {
  const { openmodal } = useGlobalContext();

  return (
    <SecondaryModal
      size="5xl"
      open={openmodal[close] as boolean}
      onPageChange={setclose}
      closebtn
    >
      <div className="w-full h-full relative p-2 rounded-lg flex flex-col items-center gap-y-10">
        <h3 className="w-full text-center font-bold text-xl">
          {`Products (${data?.length ?? 0})`}
        </h3>

        <div className="productlist w-full max-h-[60vh] overflow-y-auto flex flex-col items-center gap-y-5">
          {data?.map((item) => (
            <Checkoutproductcard
              key={item.id}
              qty={item.quantity}
              cover={item.product?.covers[0].url as string}
              name={item.product?.name as string}
              details={item.selectedvariant}
              price={item.price}
              total={
                item.quantity *
                (((item.price.discount?.newprice ??
                  item.product?.price) as number) ?? 0)
              }
            />
          ))}
        </div>
      </div>
    </SecondaryModal>
  );
};
