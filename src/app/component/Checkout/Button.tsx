import { useGlobalContext } from "@/src/context/GlobalContext";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import PrimaryButton from "../Button";
import Link from "next/link";

export const BackAndEdit = ({ step }: { step: number }) => {
  const { setcart } = useGlobalContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handleedit = () => {
    if (step === 1) {
      setcart(true);
    } else if (step > 1 && step < 4) {
      const current = new URLSearchParams(searchParams);
      const prevstep = step > 1 ? step - 1 : step;
      current.set("step", prevstep.toString());
      const value = current.toString();
      const query = `?${value}`;

      router.push(`${pathname}${query}`);
    }
  };
  return (
    <div
      className={`btn-1 flex flex-col items-center gap-3 w-[150px] h-fit 
        max-small_tablet:w-full max-small_tablet:order-3 max-small_tablet:flex-row`}
    >
      <PrimaryButton
        text={step === 1 ? "Edit" : "Back"}
        color="lightcoral"
        type="button"
        onClick={() => handleedit()}
        height="50px"
        width="100%"
        radius="10px"
      />
      <PrimaryButton
        text="Back to shop"
        type="button"
        height="50px"
        width="100%"
        radius="10px"
      />
    </div>
  );
};

export const Proceedbutton = ({ step }: { step: number }) => {
  return (
    <PrimaryButton
      text="Confirm"
      type={step === 3 ? "button" : "submit"}
      height="50px"
      disable={step === 3}
      width="100%"
      radius="10px"
    />
  );
};

export const Navigatebutton = ({
  title,
  to,
}: {
  title: string;
  to: string;
}) => {
  return (
    <Link href={to}>
      <PrimaryButton
        text={title}
        type="button"
        height="50px"
        width="100%"
        radius="10px"
      />
    </Link>
  );
};
