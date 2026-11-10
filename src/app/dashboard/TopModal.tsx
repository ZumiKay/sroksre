"use client";
import { Alertmodal, ConfirmModal } from "../component/SideMenu";
import { useGlobalStore } from "@/src/context/GlobalContext";

export default function TopModal() {
  const openmodal = useGlobalStore((s) => s.openmodal);

  return (
    <>
      {openmodal.confirmmodal.open && <ConfirmModal />}
      {openmodal.alert.open && <Alertmodal />}
    </>
  );
}
