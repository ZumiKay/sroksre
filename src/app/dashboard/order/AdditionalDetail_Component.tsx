import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../../component/Modals";
import DetailTable from "./Detail_Component";

interface AdditionalDetailModalProps {
  type?: "user" | "shipping";
}
export const AdditionalDetailModal = ({ type }: AdditionalDetailModalProps) => {
  const { openmodal, setopenmodal } = useGlobalContext();

  if (!type) return <></>;

  return (
    <SecondaryModal
      open={openmodal.orderdetail ?? false}
      onPageChange={() => setopenmodal({ orderdetail: false })}
      size="lg"
    >
      <div className="flex flex-col gap-2">
        <DetailTable ty={type} />
      </div>
    </SecondaryModal>
  );
};
