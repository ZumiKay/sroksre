"use client";
import Modal from "../Modals";
import { Button, CircularProgress, Input } from "@nextui-org/react";
import { Search_Icon } from "../Asset";
import { ProductCard } from "../HomePage/Component";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { motion } from "framer-motion";
import { Orderpricetype } from "@/src/context/OrderContext";
import { useState } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { errorToast, LoadingText } from "../Loading";

interface Searchproducttype {
  id: number;
  name: string;
  parentcategory_id: number;
  childcategory_id?: number;
  price: Orderpricetype;
  covers: { name: string; url: string };
}
export default function SearchContainer() {
  const { setopenmodal } = useGlobalContext();
  const [product, setproduct] = useState<Searchproducttype[]>([]);
  const [search, setsearch] = useState("");
  const [loading, setloading] = useState(false);
  const handleSearch = async (
    e: React.KeyboardEvent | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setloading(true);
      const response = await ApiRequest(
        `/api/products/ty=search_q=${search}`,
        undefined,
        "GET"
      );
      setloading(false);
      if (!response.success) {
        errorToast("Error Occured");
        return;
      }
      setproduct(response.data);
    }
  };

  return (
    <Modal closestate="searchcon" customwidth="100vw" customheight="70vh">
      <motion.div
        initial={{ y: -500, height: 40 }}
        animate={{ y: 0, height: "100%" }}
        exit={{ y: -500, opacity: 0, height: 40 }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
        className="search_container w-full h-full bg-white p-3 rounded-lg flex flex-col items-center justify-center gap-y-5"
      >
        <div className="w-full h-fit flex flex-row items-center justify-evenly">
          <Input
            isClearable
            type="text"
            className="w-[70%] h-[40px]"
            placeholder="Search"
            onChange={(e) => setsearch(e.target.value)}
            endContent={loading && <CircularProgress />}
            startContent={
              <div onClick={() => alert("dfsd")}>
                <Search_Icon />
              </div>
            }
            size="lg"
            color="default"
            onKeyDown={handleSearch}
          />
          <Button
            className="w-[150px] h-[40px] font-bold"
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, searchcon: false }))
            }
          >
            Cancel
          </Button>
        </div>

        <div className="previewsearch_res w-full h-[60vh] flex flex-row justify-center flex-wrap gap-3 overflow-y-auto overflow-x-hidden">
          {loading && <LoadingText />}
          {product.map((prob) => (
            <ProductCard
              id={prob.id}
              key={prob.id}
              img={{ ...prob.covers }}
              name={prob.name}
              price={prob.price}
            />
          ))}
        </div>
      </motion.div>
    </Modal>
  );
}
