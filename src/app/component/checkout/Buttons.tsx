"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../Button";
import { useState } from "react";
import { terminateCheckoutSession } from "@/src/app/checkout/action";

/**
 * Edit Cart / Back / Continue Shopping buttons.
 *
 * "Edit Cart" (step 1) and "Continue Shopping" terminate the checkout session
 * before navigating away so stock holds are released and cart items revert.
 * "Back" (step > 1) moves to the previous checkout step without terminating.
 */
export const BackAndEdit = ({
  step,
  orderId,
}: {
  step: number;
  orderId: string;
}) => {
  const { setcart } = useGlobalContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLeaving, setIsLeaving] = useState(false);

  const terminateAndNavigate = async (action: "editCart" | "shop") => {
    setIsLeaving(true);
    await terminateCheckoutSession(orderId);
    if (action === "editCart") {
      setcart(true);
      router.push("/");
    } else {
      router.push("/");
    }
    setIsLeaving(false);
  };

  const handleEdit = async () => {
    if (step === 1) {
      // Opens cart and terminates the checkout session
      await terminateAndNavigate("editCart");
    } else if (step > 1 && step < 4) {
      // Go back one step — session stays alive
      const params = new URLSearchParams(searchParams);
      params.set("step", (step - 1).toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <PrimaryButton
        text={step === 1 ? "Edit Cart" : "Back"}
        color="#4B5563"
        type="button"
        onClick={handleEdit}
        height="48px"
        width="100%"
        radius="12px"
        status={isLeaving ? "loading" : "authenticated"}
      />
      <PrimaryButton
        text="Continue Shopping"
        type="button"
        color="#111827"
        height="48px"
        width="100%"
        radius="12px"
        onClick={() => terminateAndNavigate("shop")}
        status={isLeaving ? "loading" : "authenticated"}
      />
    </div>
  );
};

export const Proceedbutton = ({ step }: { step: number }) => (
  <PrimaryButton
    text={step === 3 ? "Processing..." : "Continue"}
    type={step === 3 ? "button" : "submit"}
    color="#2563EB"
    height="52px"
    disable={step === 3}
    width="100%"
    radius="12px"
  />
);

export const Navigatebutton = ({
  title,
  to,
}: {
  title: string;
  to: string;
}) => (
  <Link href={to} className="w-full">
    <PrimaryButton
      text={title}
      type="button"
      height="56px"
      width="100%"
      radius="12px"
    />
  </Link>
);
