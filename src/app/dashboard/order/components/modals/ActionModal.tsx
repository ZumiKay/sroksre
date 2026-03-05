"use client";

import ReactDOMServer from "react-dom/server";
import { ChangeEvent, useEffect, useState } from "react";
import PrimaryButton, { Selection } from "@/src/app/component/Button";
import Modal, { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Allstatus } from "@/src/types/order.type";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderReceiptTemplate } from "@/src/app/component/EmailTemplate";
import { deleteOrder, updateOrderStatus } from "../../action";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { OrderUserType } from "@/src/app/checkout/action";
import useCheckSession from "@/src/hooks/useCheckSession";

// ---------- ActionModal ----------

interface ActionModalProps {
  types: "none" | "action" | "status";
  close: string;
  oid: string;
  order: OrderUserType;
  setclose: () => void;
}

export const ActionModal = ({
  types,
  close,
  oid,
  order,
  setclose,
}: ActionModalProps) => {
  const [actiontype, setactiontype] = useState<string>(types);
  const { openmodal } = useGlobalContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClose = () => {
    const url = new URLSearchParams(searchParams);
    url.delete("id");
    url.delete("ty");
    setclose();
    router.push(`?${url}`, { scroll: false });
  };

  return (
    <SecondaryModal
      size="lg"
      open={openmodal[close] as boolean}
      onPageChange={handleClose}
      closebtn
    >
      <div className="w-full h-full flex flex-col gap-y-5">
        {actiontype === "none" && (
          <>
            <h3 className="w-full text-center text-xl font-bold">Action</h3>
            <div className="w-full h-fit flex flex-col gap-y-32 items-center">
              <div className="flex flex-col w-full items-center gap-y-5">
                <PrimaryButton
                  type="button"
                  text="Update Status"
                  onClick={() => setactiontype("status")}
                  radius="10px"
                  width="90%"
                />
                <PrimaryButton
                  type="button"
                  text="Delete"
                  width="90%"
                  onClick={() => setactiontype("delete")}
                  radius="10px"
                  color="lightcoral"
                />
              </div>
            </div>
          </>
        )}
        {actiontype === "status" && (
          <UpdateStatus setactiontype={setactiontype} oid={oid} order={order} />
        )}
        {actiontype === "delete" && (
          <OrderAlert settype={setactiontype} oid={oid} close={setclose} />
        )}
      </div>
    </SecondaryModal>
  );
};

// ---------- UpdateStatus ----------

interface UpdateStatusProps {
  setactiontype: (type: string) => void;
  oid: string;
  order: OrderUserType;
}

const UpdateStatus = ({ setactiontype, oid, order }: UpdateStatusProps) => {
  const router = useRouter();
  const [status, setstatus] = useState(order?.status ?? "");
  const [loading, setloading] = useState(false);
  const { handleCheckSession } = useCheckSession();

  useEffect(() => {
    setstatus(order?.status);
  }, [order?.status]);

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setstatus(e.target.value as typeof order.status);
  };

  const handleUpdate = async () => {
    setloading(true);
    const isValid = await handleCheckSession();
    if (!isValid) {
      errorToast("Can't Verify Session");
      setloading(false);
      return;
    }

    const emailTemplate = ReactDOMServer.renderToStaticMarkup(
      <OrderReceiptTemplate
        order={{ ...order, status: status as any }}
        isAdmin={false}
      />,
    );
    const update = await updateOrderStatus.bind(
      null,
      status as any,
      oid,
      emailTemplate,
    )();
    setloading(false);

    if (!update.success) {
      errorToast(update.message);
      return;
    }
    successToast(update.message);
    router.refresh();
  };

  return (
    <div className="w-full h-full flex flex-col gap-y-10">
      <h3 className="w-full text-center font-bold text-xl">Update Status</h3>
      <div className="flex flex-col gap-y-2">
        <label className="w-full text-lg font-bold text-left">Status</label>
        <Selection
          default="Status"
          value={status}
          data={Object.values(Allstatus)}
          onChange={handleSelect}
        />
      </div>
      <div className="w-full h-fit inline-flex gap-x-5">
        <PrimaryButton
          type="button"
          disable={!status || status === order?.status}
          text="Update"
          status={loading ? "loading" : "authenticated"}
          onClick={handleUpdate}
          color="#0097FA"
          radius="10px"
        />
        <PrimaryButton
          type="button"
          text="Cancel"
          radius="10px"
          onClick={() => setactiontype("none")}
          color="lightcoral"
        />
      </div>
    </div>
  );
};

// ---------- OrderAlert ----------

interface OrderAlertProps {
  settype: (type: string) => void;
  oid: string;
  close: () => void;
}

export const OrderAlert = ({ settype, oid, close }: OrderAlertProps) => {
  const [loading, setloading] = useState(false);

  const handleYes = async () => {
    setloading(true);
    const result = await deleteOrder.bind(null, oid)();
    setloading(false);
    if (!result.success) {
      errorToast(result.message);
      return;
    }
    successToast("Deleted");
    close();
  };

  return (
    <Modal
      closestate="discount"
      customZIndex={120}
      customheight="300px"
      customwidth="300px"
    >
      <div className="w-full h-75 bg-white rounded-lg grid place-items-center">
        <h3 className="w-full text-center">Are you sure?</h3>
        <div className="w-full h-full flex flex-col items-center gap-y-5">
          <PrimaryButton
            onClick={handleYes}
            type="button"
            status={loading ? "loading" : "authenticated"}
            text="Yes"
            radius="10px"
          />
          <PrimaryButton
            type="button"
            onClick={() => settype("none")}
            text="No"
            radius="10px"
            color="lightcoral"
          />
        </div>
      </div>
    </Modal>
  );
};
