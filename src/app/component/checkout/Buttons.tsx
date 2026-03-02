"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../Button";

// -----------------------------------------------------------------------------
// BackAndEdit
// -----------------------------------------------------------------------------

export const BackAndEdit = ({ step }: { step: number }) => {
  const { setcart } = useGlobalContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleEdit = () => {
    if (step === 1) {
      setcart(true);
    } else if (step > 1 && step < 4) {
      const params = new URLSearchParams(searchParams);
      params.set("step", (step - 1).toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs max-small_tablet:max-w-full max-small_tablet:flex-row">
      <PrimaryButton
        text={step === 1 ? "Edit Cart" : "Back"}
        color="#6B7280"
        type="button"
        onClick={handleEdit}
        height="50px"
        width="100%"
        radius="12px"
      />
      <Link href="/" className="w-full">
        <PrimaryButton
          text="Continue Shopping"
          type="button"
          height="50px"
          width="100%"
          radius="12px"
        />
      </Link>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Proceedbutton
// -----------------------------------------------------------------------------

export const Proceedbutton = ({ step }: { step: number }) => (
  <PrimaryButton
    text={step === 3 ? "Processing..." : "Continue"}
    type={step === 3 ? "button" : "submit"}
    height="50px"
    disable={step === 3}
    width="100%"
    radius="12px"
  />
);

// -----------------------------------------------------------------------------
// Navigatebutton
// -----------------------------------------------------------------------------

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
