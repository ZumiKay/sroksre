"use client";
import PrimaryButton from "../../component/Button";
import Card from "../../component/Card";
import Default from "../../Asset/Image/default.png";
import { CreateProducts } from "../../component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";

export enum INVENTORYENUM {
  size = "SIZE",
  normal = "NORMAL",
  color = "COLOR",
}

export default function Inventory() {
  const { openmodal, setopenmodal } = useGlobalContext();

  const handleOpen = (type: string) => {
    setopenmodal({ ...openmodal, [type]: true });
  };
  return (
    <main className="inventory__container w-full flex flex-col gap-y-14">
      <div className="inventory_header bg-white sticky z-30 top-[6vh] flex flex-row justify-start items-center w-full gap-x-20 p-2 border-b border-black">
        <PrimaryButton
          color="#6FCF97"
          radius="10px"
          type="button"
          text="CREATE"
          onClick={() => handleOpen("createProduct")}
          Icon={<i className="fa-solid fa-plus text-sm text-black"></i>}
        />

        <PrimaryButton
          color="#60513C"
          radius="10px"
          type="button"
          text={"Total: 0"}
        />
        <PrimaryButton
          color="#F08080"
          radius="10px"
          type="button"
          text={"Low Stock: 0"}
        />
        <PrimaryButton
          color="#4688A0"
          radius="10px"
          type="button"
          text={"Filter"}
        />
      </div>
      <div className="productlist w-full grid grid-cols-4">
        <Card img={Default} name="ProductName" price="$20.00" />
        <Card img={Default} name="ProductName" price="$20.00" />
        <Card img={Default} name="ProductName" price="$20.00" />
        <Card img={Default} name="ProductName" price="$20.00" />
        <Card img={Default} name="ProductName" price="$20.00" />
      </div>
      //action modal
      {openmodal.createProduct && <CreateProducts />}
    </main>
  );
}
