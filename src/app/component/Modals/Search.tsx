"use client";
import Modal from "../Modals";
import { Button, CircularProgress, Input } from "@heroui/react";
import { CloseVector, Search_Icon } from "../Asset";
import { ProductCard } from "../HomePage/Component";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { ProductState } from "@/src/context/GlobalType.type";

export default function SearchContainer({ isMobile }: { isMobile: boolean }) {
  const { setopenmodal } = useGlobalContext();
  const [product, setproduct] = useState<Array<ProductState>>([]);
  const [search, setsearch] = useState("");
  const [loading, setloading] = useState(false);

  const handleSearch = async (
    e: React.KeyboardEvent | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setloading(true);
      const response = await ApiRequest({
        url: `/api/products?ty=search&q=${search}`,
        method: "GET",
      });
      setloading(false);
      if (!response.success) {
        errorToast("Error Occured");
        return;
      }
      setproduct(response.data as Array<ProductState>);
    }
  };

  const handleCloseModal = () =>
    setopenmodal((prev) => ({ ...prev, searchcon: false }));

  return (
    <Modal
      closestate="searchcon"
      customwidth="100vw"
      customheight={isMobile ? "100vh" : "70vh"}
    >
      <motion.div
        initial={{ y: -500, height: 40 }}
        animate={{ y: 0, height: "100%" }}
        exit={{ y: -500, opacity: 0, height: 40 }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
        className="search_container w-full h-full bg-white p-5 shadow-lg max-small_phone:rounded-none rounded-xl flex flex-col items-center justify-center max-small_phone:justify-start gap-y-6"
      >
        <div className="w-full h-fit flex flex-row items-center justify-between">
          <Input
            isClearable
            type="text"
            className="w-[75%] h-[45px]"
            placeholder="Search for products..."
            onChange={(e) => setsearch(e.target.value)}
            endContent={loading && <CircularProgress size="sm" />}
            startContent={
              <div className="cursor-pointer hover:text-blue-600 transition-colors">
                <Search_Icon />
              </div>
            }
            size="lg"
            color="primary"
            onKeyDown={handleSearch}
          />

          <Button
            className="w-[150px] h-[45px] font-semibold text-base hover:scale-105 transition-transform max-smallest_tablet:hidden"
            onPress={handleCloseModal}
            color="default"
            variant="flat"
          >
            Cancel
          </Button>
          <div
            onClick={handleCloseModal}
            className="w-fit h-fit hidden max-small_phone:block cursor-pointer hover:scale-110 transition-transform"
          >
            <CloseVector width="30px" height="30px" />
          </div>
        </div>

        <div className="previewsearch_res w-full h-[60vh] max-small_phone:h-[90vh] flex flex-row justify-center flex-wrap gap-4 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {product.length > 0 ? (
            product.map((prob) => <ProductCard key={prob.id} {...prob} />)
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
              {search ? "No products found" : "Search for products"}
            </div>
          )}
        </div>
      </motion.div>
    </Modal>
  );
}
