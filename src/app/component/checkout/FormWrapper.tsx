"use client";

import { JSX, ReactNode, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent } from "react";
import { handleShippingAdddress } from "@/src/app/checkout/action";
import { errorToast, LoadingText } from "../Loading";
import { shippingtype } from "../Modals/User";
import useCheckSession from "@/src/hooks/useCheckSession";

export const FormWrapper = ({
  children,
  step,
  order_id,
  BodyContent,
}: {
  children: ReactNode;
  step: number;
  order_id: string;
  BodyContent?: JSX.Element;
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

    //Capture all form's input field value
    const form = event.currentTarget;
    const isShipping = form.elements.namedItem(
      "shipping",
    ) as HTMLInputElement | null;
    const isSaved = (form.elements.namedItem("save") as HTMLInputElement | null)
      ?.value;
    setLoading(true);

    //Check user session
    const isValid = await handleCheckSession();
    if (!isValid) {
      setLoading(false);
      return;
    }

    if (isShipping) {
      const selectedIndex = parseInt(
        (form.elements.namedItem("selected_address") as HTMLInputElement)
          ?.value ?? "0",
      );

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
      className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start"
    >
      {loading && <LoadingText />}

      <section className="order-2 lg:order-1 min-w-0">{BodyContent}</section>
      <aside className="order-1 lg:order-2 w-full lg:sticky lg:top-6">
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
          {children}
        </div>
      </aside>
    </form>
  );
};
