"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectField, SelectOption } from "@/src/app/component/SelectField";
import { Allstatus } from "@/src/types/order.type";

const STATUS_COLORS: Record<string, string> = {
  [Allstatus.incart]: "#495464",
  [Allstatus.unpaid]: "#EB5757",
  [Allstatus.paid]: "#35C191",
  [Allstatus.prepareing]: "#0097FA",
  [Allstatus.shipped]: "#60513C",
  [Allstatus.arrived]: "#35C191",
};

const STATUS_OPTIONS: SelectOption[] = Object.values(Allstatus).map((s) => ({
  label: s,
  value: s,
  color: STATUS_COLORS[s],
}));

/** Order list filter: pick one or more statuses, kept in the `status` URL param */
export function StatusFilterSelect() {
  const [selected, setSelected] = useState<SelectOption[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // On first show, drop any status filter left in the URL
  const clearStatusParam = useEffectEvent(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("status")) {
      params.delete("status");
      router.push(`?${params}`);
    }
  });
  useEffect(() => {
    clearStatusParam();
  }, []);

  const handleChange = (value: SelectOption[]) => {
    const params = new URLSearchParams(searchParams);
    if (value.length === 0) params.delete("status");
    else params.set("status", value.map((o) => o.value).join(","));
    router.push(`?${params}`);
    setSelected(value);
  };

  return (
    <SelectField
      selectionMode="multiple"
      ariaLabel="Filter by status"
      placeholder="Filter by status"
      size="md"
      isClearable
      options={STATUS_OPTIONS}
      value={selected}
      onChange={handleChange}
    />
  );
}
