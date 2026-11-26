"use client";
import { Button } from "@heroui/react";
import { SelectField } from "../component/SelectField";
import Modal from "../component/Modals";
import React, { useState } from "react";
import { showtype } from "../api/policy/route";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { errorToast } from "../component/Loading";
import { useGlobalStore } from "@/src/context/GlobalContext";
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
  const setopenmodal = useGlobalStore((s) => s.setopenmodal);
  const router = useRouter();
  const [values, setValues] = React.useState(value ?? new Set([""]));
  const [loading, setloading] = useState(false);
  const { isTablet, isMobile } = useScreenSize();

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
        <SelectField
          selectionMode="multiple"
          label="Show Type"
          placeholder="Select Type"
          options={showtypedata}
          value={showtypedata.filter((o) => values.has(o.value))}
          onChange={(selected) =>
            setValues(new Set(selected.map((o) => String(o.value))))
          }
        />
        <Button
          fullWidth
          isLoading={loading}
          size="lg"
          color="success"
          style={{ color: "white", fontWeight: "bold" }}
          variant="solid"
          onClick={() => handleUpdatePolicy()}
        >
          Confirm
        </Button>
        <Button
          fullWidth
          isLoading={loading}
          size="lg"
          variant="solid"
          style={
            !isMobile
              ? {
                  display: "none",
                }
              : {
                  backgroundColor: "lightcoral",
                  color: "white",
                  fontWeight: "bold",
                }
          }
          onClick={() => setopenmodal((prev) => ({ ...prev, showtype: false }))}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};
