import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { errorToast, successToast } from "../Loading";
import Modal from "../Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faWarehouse,
  faInfoCircle,
  faSpinner,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import { Chip as NextChip } from "@heroui/react";
import { useState } from "react";
import { methodtype } from "@/src/lib/middlewareaction";

export const UpdateStockModal = ({
  closename,
  productId,
}: {
  closename: string;
  productId?: number;
}) => {
  const { product, setproduct, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState<Partial<Record<methodtype, boolean>>>(
    {},
  );

  const handleUpdate = async () => {
    const update = await ApiRequest(
      "/api/products/crud",
      setloading as never,
      "PUT",
      "JSON",
      { stock: product.stock, id: product.id, type: "editstock" },
    );
    if (!update.success) {
      errorToast("Failed To Update Stock");
      return;
    }

    successToast("Updated");
    setproduct(Productinitailizestate);
    setopenmodal((prev) => ({ ...prev, [closename]: false }));
  };
  return (
    <Modal closestate={closename}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="updatestock w-full h-full rounded-2xl flex flex-col gap-y-6 bg-white p-6 border border-gray-200"
      >
        <div className="w-full space-y-2 pb-4 border-b-2 border-blue-200">
          <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-white" />
            </div>
            Update Stock
          </h4>
          <p className="text-sm text-gray-500 ml-13">
            Adjust the inventory quantity for this product
          </p>
        </div>

        <div className="w-full bg-white rounded-xl p-5 border-2 border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faWarehouse}
              className="text-lg text-blue-500"
            />
            <h5 className="font-bold text-gray-800">Stock Quantity</h5>
          </div>
          <input
            type="number"
            placeholder="Enter stock quantity"
            name="stock"
            min={0}
            max={1000}
            onChange={(e) => {
              const { value } = e.target;
              const val = parseInt(value);
              setproduct((prev) => ({ ...prev, stock: val }));
            }}
            value={product.stock}
            required
            className="w-full h-14 text-lg px-4 font-bold rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-hidden transition-colors"
          />
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FontAwesomeIcon icon={faInfoCircle} />
            Maximum allowed: 1000 units
          </p>
        </div>

        <div className="w-full flex flex-row gap-4">
          <button
            type="button"
            onClick={() => handleUpdate()}
            disabled={loading?.PUT || loading?.GET}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              loading?.PUT || loading?.GET
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loading?.PUT ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} />
                <span>Update Stock</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setopenmodal((prev) => ({ ...prev, [closename]: false }));
            }}
            disabled={loading?.PUT || loading?.GET}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              loading?.PUT || loading?.GET
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <FontAwesomeIcon icon={faTimes} />
            <span>Cancel</span>
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

interface Stockcardprops {
  label: string;
  color?: string;
  onClick?: () => void;
}

export function StockCard({ label, color, onClick }: Stockcardprops) {
  return (
    <NextChip
      key={label}
      onClick={() => onClick && onClick()}
      size="lg"
      startContent={
        color && (
          <div
            style={{ backgroundColor: color }}
            className="w-[20px] h-[20px] rounded-full"
          ></div>
        )
      }
    >
      {label}
    </NextChip>
  );
}
