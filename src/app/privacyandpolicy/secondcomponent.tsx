"use client";
import { Button, Select, SelectItem } from "@heroui/react";
import { SecondaryModal } from "../component/Modals";
import React, { ChangeEvent, useCallback, useState } from "react";
import { showtype } from "../api/policy/route";
import { ApiRequest } from "@/src/context/CustomHook";
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
  const { openmodal, setopenmodal } = useGlobalContext();
  const router = useRouter();
  const [values, setValues] = React.useState(value ?? new Set([""]));
  const [loading, setloading] = useState(false);

  const handleSelectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setValues(new Set(e.target.value.split(",")));
  };

  const handleUpdatePolicy = useCallback(async () => {
    setloading(true);
    const value = Array.from(values)
      .filter((i) => i !== "")
      .join(",");
    const request = await ApiRequest({
      url: "/api/policy",
      method: "PUT",
      data: {
        id,
        showtype: value,
        ty: "showtype",
      },
    });
    if (!request.success) {
      errorToast("Error Occured");
      return;
    }

    setopenmodal((prev) => ({ ...prev, showtype: false }));
    router.refresh();
  }, [id, router, setopenmodal, values]);

  const handleClose = useCallback(() => {
    setopenmodal({ policyshowtype: false });
  }, [setopenmodal]);

  return (
    <SecondaryModal
      open={openmodal.policyshowtype ?? false}
      onPageChange={() => handleClose()}
      size="md"
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
          size="lg"
          color="success"
          style={{ color: "white", fontWeight: "bold" }}
          variant="solid"
          onPress={() => handleUpdatePolicy()}
        >
          Confirm
        </Button>
      </div>
    </SecondaryModal>
  );
};
