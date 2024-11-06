import {
  SubStockType,
  useGlobalContext,
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalContext";
import { StockCard } from "../Stock";
import { Badge } from "@nextui-org/react";
import { useEffect, useMemo } from "react";

interface RenderStockCardsProps {
  handleDeleteSubStock: (idx: number) => void;
  edit: number;
  handleSubStockClick: (val: string[], qty: string, idx: number) => void;
}
const RenderStockCards = ({
  edit,
  handleDeleteSubStock,
  handleSubStockClick,
}: RenderStockCardsProps) => {
  const { product } = useGlobalContext();
  if (!product || !product.variants) return null;

  const { variants, varaintstock } = product;

  const stockValues = useMemo(
    () =>
      varaintstock &&
      (varaintstock[edit].Stockvalue as unknown as SubStockType[]),
    [varaintstock, edit]
  );

  const lowstock = useMemo(() => parseInt(process.env.LOWSTOCK ?? "3"), []);

  const variantLookup = useMemo(
    () =>
      variants.reduce((acc, variant) => {
        variant.option_value.forEach((opt) => {
          const key = typeof opt === "string" ? opt : opt.val;
          acc[key] = variant;
        });
        return acc;
      }, {} as { [key: string]: any }),
    [variants]
  );

  return (
    stockValues?.map((i, idx) => {
      const isLowStock = i.qty <= lowstock;
      const borderStyle = isLowStock ? { border: "3px solid lightcoral" } : {};

      return (
        <Badge
          key={`badge-${idx}`}
          content="-"
          color="danger"
          onClick={() => {
            handleDeleteSubStock(idx);
          }}
        >
          <div
            onClick={() =>
              handleSubStockClick(i.variant_val, i.qty.toString(), idx)
            }
            style={borderStyle}
            className="w-fit h-fit flex flex-col gap-y-3 rounded-lg p-2 border-2 border-gray-300 cursor-pointer transition-colors hover:border-gray-500 active:border-black"
          >
            {i.variant_val?.map((item) => {
              const variant = variantLookup[item] as Varianttype;

              const isColor =
                variant.option_type === "COLOR"
                  ? (variant.option_value as VariantColorValueType[])
                  : undefined;

              return (
                <StockCard
                  key={item}
                  label={
                    variant.option_type === "COLOR"
                      ? isColor?.find((i) => i.val === item)?.name ?? ""
                      : item
                  }
                  color={isColor ? item : undefined}
                />
              );
            })}
          </div>
        </Badge>
      );
    }) || null
  );
};

export default RenderStockCards;
