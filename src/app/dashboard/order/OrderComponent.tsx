"use client";

import ReactDOMServer from "react-dom/server";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PrimaryButton, { Selection } from "../../component/Button";
import { SecondaryModal } from "../../component/Modals";
import { SecondaryConfirmModal } from "../../component/Modals/Alert_Modal";
import { OrderReceiptTemplate } from "../../component/EmailTemplate";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  Allstatus,
  OrderDetialModalType,
  Ordertype,
} from "@/src/context/OrderContext";
import { errorToast, successToast } from "../../component/Loading";
import { getStatusColor } from "@/src/lib/additionalutitlites";
import { UpdateOrderStatus } from "./action";
import { Button } from "@heroui/react";

// Types

interface UpdateStatusProps {
  setactiontype: (val: OrderDetialModalType) => void;
  status?: Allstatus;
}

// Styles
const styles = {
  container: "w-full h-full flex flex-col gap-y-6 p-6",
  header: "text-center text-xl font-bold text-gray-800 mb-4",
  actionContainer: "flex flex-col items-center gap-y-4 w-full",
  buttonGroup: "flex gap-x-4 w-full justify-center",
  formGroup: "flex flex-col gap-y-3",
  label: "text-lg font-semibold text-gray-700",
  loadingSpinner:
    "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600",
} as const;

// Action buttons configuration
const ACTION_BUTTONS = [
  {
    id: "status",
    text: "Update Status",
    color: "#3B82F6",
    icon: "📝",
  },
  {
    id: "delete",
    text: "Delete Order",
    color: "#EF4444",
    icon: "🗑️",
  },
] as const;

// Main ActionModal Component
export const ActionModal = memo(({ status }: { status: Allstatus }) => {
  const { openmodal, setopenmodal, globalindex } = useGlobalContext();
  const [actiontype, setactiontype] = useState<string>("none");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoized handlers
  const handleDelete = useCallback(async (orderId: string) => {
    try {
      const response = await ApiRequest({
        url: "/api/order/list",
        method: "DELETE",
        data: { id: orderId, ty: "single" },
      });

      if (response.success) {
        successToast("Order deleted successfully");
      } else {
        errorToast(response.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete order error:", error);
      errorToast("An error occurred while deleting the order");
    }
  }, []);

  const handleActionClick = useCallback(
    (type: string) => {
      if (type === "delete" && globalindex.orderId) {
        setopenmodal({
          confirmmodal: {
            open: true,
            onAsyncDelete: () => handleDelete(globalindex.orderId as string),
            Warn: `Are you sure you want to delete order #${globalindex.orderId}? This action cannot be undone.`,
          },
        });
        return;
      }
      setactiontype(type);
    },
    [handleDelete, globalindex.orderId, setopenmodal]
  );

  const handleClose = useCallback(() => {
    const url = new URLSearchParams(searchParams);
    url.delete("id");
    url.delete("ty");
    router.push(`?${url}`, { scroll: false });
  }, [router, searchParams]);

  // Render action buttons
  const renderActionButtons = useMemo(
    () => (
      <div className={styles.actionContainer}>
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          {ACTION_BUTTONS.map((button) => (
            <PrimaryButton
              key={button.id}
              type="button"
              text={button.text}
              Icon={button.icon}
              onClick={() => handleActionClick(button.id)}
              radius="12px"
              width="100%"
              color={button.color}
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            />
          ))}
        </div>
      </div>
    ),
    [handleActionClick]
  );

  return (
    <SecondaryModal
      size="lg"
      open={openmodal.orderactionmodal ?? false}
      onPageChange={handleClose}
      closebtn
    >
      <div className={styles.container}>
        {actiontype === "none" && (
          <>
            <h3 className={styles.header}>Order Actions</h3>
            <p className="text-center text-gray-600 mb-6">
              Choose an action for order #{globalindex.orderId || "N/A"}
            </p>
            {renderActionButtons}
          </>
        )}

        {actiontype === "status" && (
          <UpdateStatus status={status} setactiontype={setactiontype} />
        )}

        {actiontype === "delete" && <SecondaryConfirmModal />}
      </div>
    </SecondaryModal>
  );
});

ActionModal.displayName = "ActionModal";

// UpdateStatus Component
const UpdateStatus = memo<UpdateStatusProps>(({ setactiontype }) => {
  const { globalindex } = useGlobalContext();
  const [status, setStatus] = useState<Allstatus>(Allstatus.unpaid);
  const [loading, setLoading] = useState(false);
  const [order, setorder] = useState<Ordertype>();

  useEffect(() => {
    const getOrderData = async () => {
      const getReq = await ApiRequest({
        url: `/api/order/list?ty=filter&id=${globalindex.orderId}`,
      });
      if (!getReq.success) {
        errorToast(getReq.message || "Failed to fetch order data");
        return;
      }
      setorder(getReq.data as Ordertype);
    };
    getOrderData();
  }, [globalindex.orderId]);

  // Memoized status options
  const statusOptions = useMemo(
    () => Object.values(Allstatus).filter((val) => val !== "All"),
    []
  );

  // Handlers
  const handleSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as Allstatus);
  }, []);

  const handleCancel = useCallback(() => {
    setactiontype("none");
    setStatus(Allstatus.unpaid);
  }, [setactiontype]);

  const handleUpdate = useCallback(async () => {
    if (!status || !order) {
      errorToast("Invalid params");
      return;
    }

    setLoading(true);

    try {
      // Generate email template
      const emailTemplate = ReactDOMServer.renderToStaticMarkup(
        <OrderReceiptTemplate order={order} isAdmin={false} />
      );

      const updateReq = UpdateOrderStatus.bind(null, {
        orderId: globalindex.orderId as string,
        order,
        emailTemplate,
      });

      const response = await updateReq();

      if (!response.success) {
        errorToast(response.error || "Failed to update order status");
        return;
      }

      successToast("Order status updated successfully");

      // Update request
    } catch (error) {
      console.error("Update status error:", error);
      errorToast("An error occurred while updating the status");
    } finally {
      setLoading(false);
    }
  }, [globalindex.orderId, order, status]);

  // Reset status when order changes
  useEffect(() => {
    setStatus(order?.status || Allstatus.unpaid);
  }, [order?.status]);

  // Check if update is possible
  const canUpdate = useMemo(
    () => status && status !== order?.status && !loading,
    [status, order?.status, loading]
  );

  return (
    <div className={styles.container}>
      <div className="text-center mb-6">
        <h3 className={styles.header}>Update Order Status</h3>
        <p className="text-gray-600">
          Current status:
          <span
            className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              order?.status as Allstatus
            )}`}
          >
            {order?.status}
          </span>
        </p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>New Status</label>
        <Selection
          default="Select new status"
          value={status}
          data={statusOptions}
          onChange={handleSelect}
        />
      </div>

      <div className={styles.buttonGroup}>
        <Button
          isLoading={loading}
          isDisabled={!canUpdate}
          onPress={handleUpdate}
          className="max-w-[200px] font-bold text-white bg-incart"
        >
          Update
        </Button>
        <Button
          isDisabled={loading}
          onPress={handleCancel}
          className="max-w-[200px] font-bold text-gray-700 bg-gray-200 hover:bg-gray-300"
          variant="light"
        >
          Cancel
        </Button>
      </div>

      {/* Status Change Preview */}
      {status !== order?.status && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            Status will change from
            <span className="font-semibold mx-1">{order?.status}</span>
            to
            <span className="font-semibold mx-1">{status}</span>
          </p>
        </div>
      )}
    </div>
  );
});

UpdateStatus.displayName = "UpdateStatus";

export default ActionModal;
