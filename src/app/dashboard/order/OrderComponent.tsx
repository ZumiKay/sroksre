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
import { Selection } from "../../component/Button";
import { SecondaryModal } from "../../component/Modals";
import { SecondaryConfirmModal } from "../../component/Modals/Alert_Modal";
import { OrderReceiptTemplate } from "../../component/EmailTemplate";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ApiRequest, useCheckSession } from "@/src/context/CustomHook";
import { Allstatus, OrderAction, Ordertype } from "@/src/context/OrderContext";
import { errorToast, successToast } from "../../component/Loading";
import { getStatusColor } from "@/src/lib/additionalutitlites";
import { UpdateOrderStatus } from "./action";
import { Button, ButtonProps, Chip, Divider } from "@heroui/react";
import { Role } from "@/src/lib/userlib";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCancel,
  faFileArchive,
  faTimeline,
  faTrash,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { CancelOrder } from "../../checkout/cancelaction";

// Types
interface UpdateStatusProps {
  setactiontype: (val: OrderAction) => void;
  status?: Allstatus;
}

// Enhanced styles with better organization and modern design
const styles = {
  container:
    "w-full h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-gray-50 to-white",
  header: "text-2xl font-bold text-gray-900 mb-2",
  subheader: "text-gray-600 text-sm mb-6",
  actionContainer: "flex flex-col items-center gap-4 w-full",
  buttonGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl",
  formGroup: "flex flex-col gap-3",
  label: "text-sm font-semibold text-gray-700 uppercase tracking-wide",
  buttonGroup: "flex flex-col sm:flex-row gap-3 w-full justify-center mt-6",
  statusPreview:
    "mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm",
  statusBadge:
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
  backButton:
    "self-start mb-4 text-gray-600 hover:text-gray-900 transition-colors",
} as const;

// Enhanced action buttons with better styling
const ACTION_BUTTONS: Array<ButtonProps & { description?: string }> = [
  {
    id: OrderAction.updatestatus,
    content: "Update Status",
    color: "primary",
    variant: "solid",
    startContent: <FontAwesomeIcon icon={faTimeline} />,
    description: "Change the current order status",
    className:
      "h-16 text-left justify-start shadow-lg hover:shadow-xl transition-all",
  },
  {
    id: OrderAction.delete,
    content: "Delete Order",
    color: "danger",
    variant: "solid",
    startContent: <FontAwesomeIcon icon={faTrash} />,
    description: "Permanently remove this order",
    className:
      "h-16 text-left justify-start shadow-lg hover:shadow-xl transition-all",
  },
  {
    id: OrderAction.achieve,
    content: "Archive Order",
    variant: "bordered",
    startContent: <FontAwesomeIcon icon={faFileArchive} />,
    description: "Move order to archive",
    className:
      "h-16 text-left justify-start border-orange-300 text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all",
  },
] as const;

const ACTION_BUTTON_USER: Array<ButtonProps & { description?: string }> = [
  {
    id: OrderAction.achieve,
    content: "Archive Order",
    variant: "bordered",
    startContent: <FontAwesomeIcon icon={faFileArchive} />,
    description: "Move order to archive",
    className:
      "h-16 text-left justify-start border-orange-300 text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all",
  },
  {
    id: OrderAction.cancel,
    content: "Cancel Order",
    color: "danger",
    variant: "bordered",
    startContent: <FontAwesomeIcon icon={faCancel} />,
    description: "Cancel this order",
    className:
      "h-16 text-left justify-start shadow-lg hover:shadow-xl transition-all",
  },
];

// Enhanced ActionModal Component
export const ActionModal = memo(({ status }: { status: Allstatus }) => {
  const { openmodal, setopenmodal, globalindex } = useGlobalContext();
  const [actiontype, setactiontype] = useState<OrderAction>(OrderAction.none);
  const { user } = useCheckSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleCancel = useCallback(async () => {
    if (
      !globalindex.orderId ||
      (status !== Allstatus.unpaid && status !== Allstatus.incart)
    ) {
      return;
    }

    const cancelReq = CancelOrder.bind(null, globalindex.orderId);
    const makeReq = await cancelReq();

    if (!makeReq.success) {
      errorToast("Can't Cancel Order");
      return;
    }

    successToast("Order cancelled");
  }, [globalindex.orderId, status]);

  const handleActionClick = useCallback(
    (type: OrderAction) => {
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
      if (type === OrderAction.cancel) {
        setopenmodal({
          confirmmodal: {
            open: true,
            onAsyncDelete: () => handleCancel(),
            Warn: `Are you sure you want to cancel order #${globalindex.orderId}? This action cannot be undone.`,
          },
        });
        return;
      }

      setactiontype(type);
    },
    [globalindex.orderId, setopenmodal, handleDelete, handleCancel]
  );

  const handleClose = useCallback(() => {
    setopenmodal({});
  }, [setopenmodal]);

  const handleBack = useCallback(() => {
    setactiontype(OrderAction.none);
  }, []);

  // Enhanced action buttons rendering
  const renderActionButtons = useMemo(() => {
    const buttons =
      user?.role !== Role.ADMIN
        ? ACTION_BUTTON_USER.filter((i) =>
            status !== Allstatus.unpaid && status !== Allstatus.incart
              ? i.id !== "cancel"
              : i
          )
        : ACTION_BUTTONS;

    return (
      <div className={styles.actionContainer}>
        <div className={styles.buttonGrid}>
          {buttons.map((button) => (
            <div key={button.id} className="flex flex-col">
              <Button
                {...button}
                startContent={undefined}
                onPress={() => handleActionClick(button.id as OrderAction)}
                className={`${button.className} group`}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2">
                    {button.startContent}
                    <span className="font-semibold">{button.content}</span>
                  </div>
                  {button.description && (
                    <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                      {button.description}
                    </span>
                  )}
                </div>
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }, [handleActionClick, status, user?.role]);

  if (!isClient) {
    return null;
  }

  return (
    <SecondaryModal
      size="2xl"
      open={openmodal.orderactionmodal ?? false}
      onPageChange={handleClose}
      closebtn
    >
      <div className={styles.container}>
        {actiontype !== "none" && (
          <Button
            variant="light"
            startContent={<FontAwesomeIcon icon={faArrowLeft} />}
            onPress={handleBack}
            className={styles.backButton}
          >
            Back to Actions
          </Button>
        )}

        {actiontype === "none" && (
          <>
            <div className="text-center">
              <h3 className={styles.header}>Order Management</h3>
              <span className={styles.subheader}>
                Managing Order{" "}
                <Chip color="primary" variant="flat" size="sm">
                  #{globalindex.orderId || "N/A"}
                </Chip>
              </span>
            </div>
            <Divider />
            {renderActionButtons}
          </>
        )}

        {user?.role === Role.ADMIN &&
          actiontype === OrderAction.updatestatus && (
            <UpdateStatus status={status} setactiontype={setactiontype} />
          )}

        {actiontype === "delete" && <SecondaryConfirmModal />}
      </div>
    </SecondaryModal>
  );
});

ActionModal.displayName = "ActionModal";

// Enhanced UpdateStatus Component
const UpdateStatus = memo<UpdateStatusProps>(({ setactiontype }) => {
  const { globalindex } = useGlobalContext();
  const [status, setStatus] = useState<Allstatus>(Allstatus.unpaid);
  const [loading, setLoading] = useState(false);
  const [order, setorder] = useState<Ordertype>();

  useEffect(() => {
    const getOrderData = async () => {
      const getReq = await ApiRequest({
        url: `/api/order/list?ty=status&id=${globalindex.orderId}`,
      });
      if (!getReq.success) {
        errorToast(getReq.message || "Failed to fetch order data");
        return;
      }
      setorder(getReq.data as Ordertype);
    };
    getOrderData();
  }, [globalindex.orderId]);

  const statusOptions = useMemo(
    () => Object.values(Allstatus).filter((val) => val !== "All"),
    []
  );

  const handleSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as Allstatus);
  }, []);

  const handleCancel = useCallback(() => {
    setactiontype(OrderAction.none);
    setStatus(Allstatus.unpaid);
  }, [setactiontype]);

  const handleUpdate = useCallback(async () => {
    if (!status || !order) {
      errorToast("Invalid params");
      return;
    }

    setLoading(true);

    try {
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
    } catch (error) {
      console.error("Update status error:", error);
      errorToast("An error occurred while updating the status");
    } finally {
      setLoading(false);
    }
  }, [globalindex.orderId, order, status]);

  useEffect(() => {
    setStatus(order?.status || Allstatus.unpaid);
  }, [order?.status]);

  const canUpdate = useMemo(
    () => status && status !== order?.status && !loading,
    [status, order?.status, loading]
  );

  return (
    <div className={styles.container}>
      <div className="text-center mb-8">
        <h3 className={styles.header}>Update Order Status</h3>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-gray-600 text-sm">Current status:</span>
          <Chip variant="flat" className={getStatusColor(order?.status)}>
            {order?.status}
          </Chip>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className={styles.formGroup}>
          <label className={styles.label}>Select New Status</label>
          <Selection
            default="Choose status..."
            value={status}
            data={statusOptions}
            onChange={handleSelect}
          />
        </div>

        {status !== order?.status && (
          <div className={styles.statusPreview}>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Chip color="default" variant="flat">
                {order?.status}
              </Chip>
              <span className="text-gray-400">→</span>
              <Chip color="primary" variant="flat">
                {status}
              </Chip>
            </div>
            <p className="text-blue-700 text-center mt-2 text-sm">
              Status will be updated and notification email will be sent
            </p>
          </div>
        )}
      </div>

      <div className={styles.buttonGroup}>
        <Button
          isLoading={loading}
          isDisabled={!canUpdate}
          onPress={handleUpdate}
          color="primary"
          variant="solid"
          size="lg"
          className="font-semibold shadow-lg"
        >
          {loading ? "Updating..." : "Update Status"}
        </Button>
        <Button
          isDisabled={loading}
          onPress={handleCancel}
          variant="bordered"
          size="lg"
          className="font-semibold"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
});

UpdateStatus.displayName = "UpdateStatus";

export default ActionModal;
