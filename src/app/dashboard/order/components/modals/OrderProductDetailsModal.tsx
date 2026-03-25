"use client";

import { Checkoutproductcard } from "@/src/app/component/Checkout";
import { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Productordertype } from "@/src/types/order.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faShoppingBag } from "@fortawesome/free-solid-svg-icons";

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
  const filteredProducts = data?.filter((i) => i.product) ?? [];
  const productCount = filteredProducts.length;

  return (
    <SecondaryModal
      size="5xl"
      open={openmodal[close] as boolean}
      onPageChange={setclose}
      closebtn
    >
      <div className="w-full flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faShoppingBag} className="text-indigo-500 text-sm" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">Order Products</h3>
            <p className="text-xs text-gray-400">
              {productCount} {productCount === 1 ? "item" : "items"} in this order
            </p>
          </div>
          {productCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {productCount}
            </span>
          )}
        </div>

        {/* ── Product list ── */}
        <div className="px-5 py-4">
          {productCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faBoxOpen} className="text-gray-300 text-xl" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-500">No products found</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  This order has no product data available
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[62vh] overflow-y-auto pr-1">
              {filteredProducts.map(({ product, quantity, selectedvariant, price }) =>
                product ? (
                  <Checkoutproductcard
                    key={product.id}
                    qty={quantity}
                    cover={product.covers[0].url as string}
                    name={product.name as string}
                    details={selectedvariant}
                    price={price}
                    total={
                      quantity *
                      (((price.discount?.newprice ?? product.price) as number) ?? 0)
                    }
                  />
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};
