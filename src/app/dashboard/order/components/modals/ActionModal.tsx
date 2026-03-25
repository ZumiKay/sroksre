"use client";

import ReactDOMServer from "react-dom/server";
import { ChangeEvent, useEffect, useState } from "react";
import { Selection } from "@/src/app/component/Button";
import Modal, { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Allstatus } from "@/src/types/order.type";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderReceiptTemplate } from "@/src/app/component/EmailTemplate";
import {
  deleteOrder,
  updateOrderSettings,
  updateOrderStatus,
} from "../../action";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { OrderUserType } from "@/src/app/checkout/action";
import useCheckSession from "@/src/hooks/useCheckSession";
import { Shippingservice } from "@/src/context/Checkoutcontext";
import { totalpricetype } from "@/src/types/order.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faSliders,
  faTrash,
  faChevronRight,
  faExclamationTriangle,
  faBolt,
  faArrowLeft,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Spinner indicator used inside action buttons */
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

// ─── ActionModal ──────────────────────────────────────────────────────────────

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

  const subTitles: Record<string, string> = {
    none: "Choose an action",
    status: "Update order status",
    settings: "Edit order settings",
    delete: "Confirm deletion",
  };

  return (
    <SecondaryModal
      size="lg"
      open={openmodal[close] as boolean}
      onPageChange={handleClose}
      closebtn
    >
      <div className="w-full flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          {actiontype !== "none" ? (
            <button
              onClick={() => setactiontype("none")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faBolt} className="text-slate-500 text-sm" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900">Order Actions</h3>
            <p className="text-xs text-gray-400">{subTitles[actiontype] ?? ""}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4">
          {actiontype === "none" && (
            <ActionMenu setactiontype={setactiontype} />
          )}
          {actiontype === "status" && (
            <UpdateStatus setactiontype={setactiontype} oid={oid} order={order} />
          )}
          {actiontype === "settings" && (
            <EditSettings setactiontype={setactiontype} oid={oid} order={order} />
          )}
          {actiontype === "delete" && (
            <OrderAlert settype={setactiontype} oid={oid} close={setclose} />
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};

// ─── ActionMenu ───────────────────────────────────────────────────────────────

interface ActionMenuProps {
  setactiontype: (type: string) => void;
}

const ACTION_ITEMS = [
  {
    key: "status",
    label: "Update Status",
    description: "Change the current order status",
    icon: faRotate,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-300 hover:bg-blue-50",
    chevronHover: "group-hover:text-blue-400",
  },
  {
    key: "settings",
    label: "Edit Settings",
    description: "Adjust VAT rate and shipping method",
    icon: faSliders,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    hoverBorder: "hover:border-violet-300 hover:bg-violet-50",
    chevronHover: "group-hover:text-violet-400",
  },
  {
    key: "delete",
    label: "Delete Order",
    description: "Permanently remove this order",
    icon: faTrash,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    hoverBorder: "hover:border-red-300 hover:bg-red-50",
    chevronHover: "group-hover:text-red-400",
  },
] as const;

const ActionMenu = ({ setactiontype }: ActionMenuProps) => (
  <div className="flex flex-col gap-2">
    {ACTION_ITEMS.map((item) => (
      <button
        key={item.key}
        onClick={() => setactiontype(item.key)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white ${item.hoverBorder} transition-all text-left group`}
      >
        <div
          className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
        >
          <FontAwesomeIcon icon={item.icon} className={`${item.iconColor} text-sm`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
          <p className="text-xs text-gray-400">{item.description}</p>
        </div>
        <FontAwesomeIcon
          icon={faChevronRight}
          className={`text-gray-300 text-xs ${item.chevronHover} transition-colors`}
        />
      </button>
    ))}
  </div>
);

// ─── UpdateStatus ─────────────────────────────────────────────────────────────

interface UpdateStatusProps {
  setactiontype: (type: string) => void;
  oid: string;
  order: OrderUserType;
}

const STATUS_COLORS: Record<string, string> = {
  Incart: "bg-gray-100 text-gray-600",
  Unpaid: "bg-amber-100 text-amber-700",
  Paid: "bg-blue-100 text-blue-700",
  Preparing: "bg-indigo-100 text-indigo-700",
  Shipped: "bg-violet-100 text-violet-700",
  Arrived: "bg-emerald-100 text-emerald-700",
  Abandoned: "bg-red-100 text-red-600",
};

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

  const isUnchanged = !status || status === order?.status;

  return (
    <div className="flex flex-col gap-5">
      {/* Current status badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Current:</span>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
            STATUS_COLORS[order?.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {order?.status ?? "—"}
        </span>
      </div>

      {/* New status selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          New Status
        </label>
        <Selection
          default="Select status"
          value={status}
          data={Object.values(Allstatus)}
          onChange={handleSelect}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled={isUnchanged || loading}
          onClick={handleUpdate}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
              Update
            </>
          )}
        </button>
        <button
          onClick={() => setactiontype("none")}
          className="flex-1 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── EditSettings ─────────────────────────────────────────────────────────────

interface EditSettingsProps {
  setactiontype: (type: string) => void;
  oid: string;
  order: OrderUserType;
}

const EditSettings = ({ setactiontype, oid, order }: EditSettingsProps) => {
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const { handleCheckSession } = useCheckSession();

  const price = order?.price as unknown as totalpricetype;
  const currentVatPercent =
    price?.subtotal && price?.vat
      ? parseFloat(((price.vat / price.subtotal) * 100).toFixed(2))
      : 0;

  const [vatPercent, setVatPercent] = useState(currentVatPercent);
  const [shippingtype, setShippingtype] = useState<string>(
    order?.shippingtype ?? "",
  );

  const handleSave = async () => {
    setloading(true);
    const isValid = await handleCheckSession();
    if (!isValid) {
      errorToast("Can't Verify Session");
      setloading(false);
      return;
    }

    const result = await updateOrderSettings.bind(
      null,
      oid,
      vatPercent,
      shippingtype,
    )();
    setloading(false);

    if (!result.success) {
      errorToast(result.message);
      return;
    }
    successToast(result.message);
    router.refresh();
  };

  const selectedShipping = Shippingservice.find((s) => s.value === shippingtype);

  return (
    <div className="flex flex-col gap-5">
      {/* VAT */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          VAT (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={vatPercent}
          onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
          className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm font-medium bg-gray-50"
          placeholder="e.g. 10 for 10%"
        />
        {price?.subtotal && vatPercent > 0 && (
          <p className="text-xs text-violet-600 font-medium">
            ≈ ${((price.subtotal * vatPercent) / 100).toFixed(2)} added to subtotal
          </p>
        )}
      </div>

      {/* Shipping service */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Shipping Service
        </label>
        <Selection
          default="Select shipping"
          value={shippingtype}
          data={Shippingservice.map((s) => ({
            label: `${s.type} — $${s.price.toFixed(2)}`,
            value: s.value,
          }))}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setShippingtype(e.target.value)
          }
        />
        {selectedShipping && (
          <p className="text-xs text-gray-400">
            ${selectedShipping.price.toFixed(2)} · {selectedShipping.estimate}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled={loading}
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
              Save
            </>
          )}
        </button>
        <button
          onClick={() => setactiontype("none")}
          className="flex-1 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── OrderAlert ───────────────────────────────────────────────────────────────

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
      customheight="auto"
      customwidth="320px"
    >
      <div className="w-full bg-white rounded-2xl p-6 flex flex-col items-center gap-5">
        {/* Warning icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-red-500 text-xl"
          />
        </div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Delete Order?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This action cannot be undone. The order and all its data will be
            permanently removed.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3">
          <button
            disabled={loading}
            onClick={handleYes}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            {loading ? <Spinner /> : "Delete"}
          </button>
          <button
            onClick={() => settype("none")}
            className="flex-1 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
