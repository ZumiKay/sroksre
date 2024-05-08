"use client";
import { Alertmodal, ConfirmModal } from "../component/SideMenu";
import { useGlobalContext } from "@/src/context/GlobalContext";

export default function TopModal() {
  const { openmodal } = useGlobalContext();

  return (
    <>
      {openmodal.confirmmodal.open && <ConfirmModal />}

      {openmodal.alert.open && <Alertmodal />}
    </>
  );
}
