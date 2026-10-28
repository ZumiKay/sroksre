"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faImage, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../../../component/Modals";
import { ModalTitle } from "../../../component/Modals/FormSection";
import { successToast } from "../../../component/Loading";
import { PromotionProductState } from "@/src/types/productAction.type";
import { toCardDiscount } from "../utils/apiBuilder";

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

/**
 * Lists every product in the promotion being edited (from all pages), so
 * discounts can be applied to exactly the products.
 */
export const PromotionProductsPanel = ({ onClose }: { onClose: () => void }) => {
  const { promotion, setpromotion, allData, setalldata } = useGlobalContext();

  // id 0 is the empty placeholder row from the initial promotion state
  const products = useMemo(
    () => promotion.Products.filter((p) => p.id !== 0),
    [promotion.Products],
  );

  const basePrice = (product: PromotionProductState) => {
    const fromPick = Number(product.discount?.oldprice);
    if (fromPick > 0) return fromPick;
    const onPage = allData?.product?.find((i) => i.id === product.id);
    return onPage ? parseFloat(onPage.price.toString()) || 0 : 0;
  };
  const hasDiscount = (product: PromotionProductState) => (product.discount?.percent ?? 0) > 0;

  const undiscountedIds = useMemo(
    () => products.filter((p) => !hasDiscount(p)).map((p) => p.id),
    [products],
  );

  // Start with the new picks checked: that's what you usually want to discount
  const [selected, setSelected] = useState<Set<number>>(() => new Set(undiscountedIds));
  const [percent, setPercent] = useState("");

  const percentValue = Number(percent);
  const isPercentValid = Number.isInteger(percentValue) && percentValue >= 1 && percentValue <= 100;
  const allChecked = products.length > 0 && selected.size === products.length;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selected.size > 0 && !allChecked;
    }
  }, [selected.size, allChecked]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleApply = () => {
    if (!isPercentValid || selected.size === 0) return;

    setpromotion((prev) => ({
      ...prev,
      Products: prev.Products.map((p) => {
        if (!selected.has(p.id)) return p;
        const price = basePrice(p);
        return {
          ...p,
          discount: {
            percent: percentValue,
            oldprice: price,
            newprice: (price - (price * percentValue) / 100).toFixed(2),
          },
        };
      }),
    }));

    // Keep the cards on the current page in sync
    setalldata((prev) => ({
      ...prev,
      product: prev?.product?.map((item) =>
        item.id && selected.has(item.id)
          ? { ...item, discount: toCardDiscount(item.price, percentValue) }
          : item,
      ),
    }));

    successToast(
      `${percentValue}% applied to ${selected.size} ${selected.size === 1 ? "product" : "products"}`,
    );
    setSelected(new Set());
    setPercent("");
  };

  const handleRemove = (id: number) => {
    setpromotion((prev) => ({
      ...prev,
      Products: prev.Products.filter((p) => p.id !== id),
      // Clears any saved discount for this product when the promotion is saved
      tempproduct: Array.from(new Set([...(prev.tempproduct ?? []), id])),
    }));
    setalldata((prev) => ({
      ...prev,
      product: prev?.product?.map((item) =>
        item.id === id ? { ...item, discount: undefined } : item,
      ),
    }));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const quickSelect = [
    { label: "All", ids: products.map((p) => p.id) },
    { label: `No discount yet (${undiscountedIds.length})`, ids: undiscountedIds },
    { label: "None", ids: [] as number[] },
  ];

  return (
    <SecondaryModal
      open
      size="2xl"
      scroll="inside"
      closebtn
      onPageChange={(open) => !open && onClose()}
      footer={() => (
        <div className="w-full flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3 max-small_phone:flex-col max-small_phone:items-stretch">
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Discount for {selected.size} selected
            </span>
            <div className="relative flex-1 min-w-24">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                placeholder="e.g. 20"
                aria-label="Discount percent"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                %
              </span>
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={!isPercentValid || selected.size === 0}
              className="h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Apply to selected
            </button>
          </div>
          {percent !== "" && !isPercentValid && (
            <p className="text-xs text-red-600">Enter a whole number from 1 to 100.</p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    >
      <div className="w-full flex flex-col gap-4 py-2">
        <ModalTitle
          title={`Promotion products (${products.length})`}
          subtitle="Includes products from every page. Check the ones to discount, then set a percent below."
        />

        {products.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-center">
            <FontAwesomeIcon icon={faBoxOpen} className="text-2xl text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No products yet</p>
            <p className="text-xs text-slate-500">Click products in the grid to add them.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={() =>
                    setSelected(allChecked ? new Set() : new Set(products.map((p) => p.id)))
                  }
                  className="w-4 h-4 accent-slate-900"
                />
                {selected.size} of {products.length} selected
              </label>
              <span className="text-slate-300" aria-hidden="true">
                |
              </span>
              <div className="flex flex-row flex-wrap gap-1.5">
                {quickSelect.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelected(new Set(option.ids))}
                    className="h-7 px-2.5 rounded-md text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200">
              {products.map((product) => {
                const price = basePrice(product);
                const discounted = hasDiscount(product);
                const isChecked = selected.has(product.id);
                return (
                  <li
                    key={product.id}
                    className={`flex flex-row items-center gap-3 px-3 py-2.5 transition-colors ${
                      isChecked ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(product.id)}
                      aria-label={`Select ${product.name ?? `product ${product.id}`}`}
                      className="w-4 h-4 shrink-0 accent-slate-900 cursor-pointer"
                    />
                    <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                      {product.cover ? (
                        <Image
                          src={product.cover}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faImage} className="text-xs text-slate-300" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(product.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {product.name ?? `Product #${product.id}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {price > 0 ? formatPrice(price) : "—"}
                        {discounted && price > 0 && (
                          <>
                            {" → "}
                            <span className="font-semibold text-slate-900">
                              {formatPrice(Number(product.discount?.newprice))}
                            </span>
                          </>
                        )}
                      </p>
                    </button>
                    {discounted ? (
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {product.discount?.percent}%
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        No discount
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      aria-label={`Remove ${product.name ?? `product ${product.id}`} from promotion`}
                      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </SecondaryModal>
  );
};
