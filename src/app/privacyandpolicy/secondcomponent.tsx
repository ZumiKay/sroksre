"use client";
import { Button, Select, SelectItem } from "@nextui-org/react";
import Modal from "../component/Modals";
import React, { ChangeEvent, useState } from "react";
import { showtype } from "../api/policy/route";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { errorToast } from "../component/Loading";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useRouter } from "next/navigation";

const showtypedata: Array<{ label: string; value: showtype }> = [
  { label: "Product Detail", value: "productdetail" },
  { label: "Receipt Email", value: "email" },
  { label: "Footer Link", value: "footer" },
  { label: "Checkout Page", value: "checkout" },
];

export const Showtypemodal = ({
  id,
  value,
}: {
  id: number;
  value: Set<string>;
}) => {
  const { setopenmodal } = useGlobalContext();
  const router = useRouter();
  const [values, setValues] = React.useState(value ?? new Set([""]));
  const [loading, setloading] = useState(false);
  const { isTablet, isMobile } = useScreenSize();

  const handleSelectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setValues(new Set(e.target.value.split(",")));
  };

  const handleUpdatePolicy = async () => {
    setloading(true);
    const value = Array.from(values)
      .filter((i) => i !== "")
      .join(",");
    const request = await ApiRequest("/api/policy", undefined, "PUT", "JSON", {
      id,
      showtype: value,
      ty: "showtype",
    });
    if (!request.success) {
      errorToast("Error Occured");
      return;
    }

    setopenmodal((prev) => ({ ...prev, showtype: false }));
    router.refresh();
  };

  return (
    <Modal
      customwidth={isMobile ? "100vw" : isTablet ? "90vw" : ""}
      closestate="showtype"
      customZIndex={200}
    >
      <div className="w-full h-full bg-white rounded-lg p-3 flex flex-col gap-y-5">
        <h3 className="text-2xl font-bold">Set Policy For Display</h3>
        <Select
          fullWidth
          label="Show Type"
          selectionMode="multiple"
          placeholder="Select Type"
          selectedKeys={values}
          size="lg"
          onChange={handleSelectionChange}
        >
          {showtypedata.map((data) => (
            <SelectItem key={data.value}>{data.label}</SelectItem>
          ))}
        </Select>
        <Button
          fullWidth
          isLoading={loading}
          size="sm"
          color="success"
          variant="solid"
          onClick={() => handleUpdatePolicy()}
        >
          Confirm
        </Button>
        <Button
          fullWidth
          isLoading={loading}
          size="sm"
          color="danger"
          variant="solid"
          style={!isMobile ? { display: "none" } : {}}
          onClick={() => setopenmodal((prev) => ({ ...prev, showtype: false }))}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};
