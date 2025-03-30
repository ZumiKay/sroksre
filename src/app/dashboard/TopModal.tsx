"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Alertmodal, ConfirmModal } from "../component/Modals/Alert_Modal";

export default function TopModal() {
  const { openmodal } = useGlobalContext();

  return (
    <>
      {openmodal?.confirmmodal?.open && <ConfirmModal />}
      {openmodal?.alert?.open && <Alertmodal />}
    </>
  );
}
