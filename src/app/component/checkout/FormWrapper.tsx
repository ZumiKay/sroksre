"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent } from "react";
import { handleShippingAdddress } from "@/src/app/checkout/action";
import { errorToast, LoadingText } from "../Loading";
import { shippingtype } from "../Modals/User";
import useCheckSession from "@/src/hooks/useCheckSession";

const STEPS = [1, 2, 3, 4];

export const FormWrapper = ({
  children,
  step,
  order_id,
}: {
  children: ReactNode;
  step: number;
  order_id: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { handleCheckSession } = useCheckSession();

  const goToNextStep = () => {
    const nextStep = step < 4 ? step + 1 : step;
    const params = new URLSearchParams(searchParams);
    params.set("step", nextStep.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const isValid = await handleCheckSession();
    if (!isValid) {
      setLoading(false);
      return;
    }

    const form = event.currentTarget;
    const isShipping = form["shipping"];
    const isSaved = form["save"]?.value;

    if (isShipping) {
      const selectedIndex = parseInt(form["selected_address"].value);

      if (selectedIndex !== -1) {
        const request = await handleShippingAdddress.bind(
          null,
          order_id,
          selectedIndex,
          undefined,
          isSaved,
        )();

        if (!request.success) {
          errorToast(request.message ?? "Error occurred");
          setLoading(false);
          return;
        }
      } else {
        const formdata = new FormData(form);
        const entries = Array.from(formdata.entries());

        if (entries.length === 0) {
          errorToast("Missing Information");
          setLoading(false);
          return;
        }

        const modifiedData = Object.fromEntries(entries);
        const request = await handleShippingAdddress.bind(
          null,
          order_id,
          undefined,
          modifiedData as shippingtype,
          isSaved,
        )();

        if (!request.success) {
          errorToast(request.message ?? "Error occurred");
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    goToNextStep();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-row justify-center gap-6 max-small_tablet:flex-col"
    >
      {loading && <LoadingText />}
      {children}
    </form>
  );
};
