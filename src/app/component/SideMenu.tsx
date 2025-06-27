"use client";
import { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import React, {
  CSSProperties,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CardSkeleton, SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BannerInitialize,
  Productinitailizestate,
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useCheckSession,
  useClickOutside,
  useScreenSize,
} from "@/src/context/CustomHook";
import { errorToast, successToast } from "./Loading";
import { motion } from "framer-motion";
import { Productordertype, totalpricetype } from "@/src/context/OrderContext";
import { Createorder } from "../checkout/action";
import {
  AddIcon,
  Bin_Icon,
  CloseVector,
  EditIcon,
  InventoryIcon,
  OrderIcon,
  PencilEditIcon,
  ProfileIcon,
  UserIcon,
} from "./Asset";
import {
  Homeitemtype,
  SelectType,
  Sessiontype,
} from "@/src/context/GlobalType.type";
import { InventoryAction } from "../dashboard/inventory/inventory.type";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import Homeeditmenu from "./HomePage/EditMenu";

interface accountmenuprops {
  setProfile: (value: SetStateAction<boolean>) => void;
  session?: Sessiontype;
}

const AccountMenuItems = [
  {
    name: "Profile",
    icon: <ProfileIcon />,
    link: "/dashboard",
    isAdmin: true,
    isUser: true,
  },
  {
    name: "My Order",
    icon: <OrderIcon />,
    link: "/dashboard/order",
    isAdmin: true,
    isUser: true,
  },
  {
    name: "Inventory",
    icon: <InventoryIcon />,
    link: "/dashboard/inventory",
    isAdmin: true,
    isUser: false,
  },
  {
    name: "Users",
    icon: <UserIcon />,
    link: "/dashboard/usermanagement",
    isAdmin: true,
    isUser: false,
  },
  {
    name: "Edit Home",
    icon: <EditIcon />,
    link: "",
    isAdmin: true,
    isUser: false,
  },
];

export default function AccountMenu({ setProfile }: accountmenuprops) {
  const pathname = usePathname();
  const router = useRouter();
  const { openmodal, setopenmodal } = useGlobalContext();
  const session = useCheckSession();
  const { isMobile } = useScreenSize();
  const ref = useClickOutside(() => setProfile(false));

  const [loading, setLoading] = useState(false);
  const [homeItems, setHomeItems] = useState<Homeitemtype[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  // Filter menu items based on current path and user role
  const filteredMenuItems = useMemo(() => {
    return AccountMenuItems.filter((item) =>
      pathname !== "/" ? item.name !== AccountMenuItems[4].name : true
    ).filter((item) =>
      session.user?.role === "ADMIN" ? item.isAdmin : item.isUser
    );
  }, [pathname, session.user]);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiRequest({
        url: "/api/users/logout",
        method: "DELETE",
      });

      if (!response.success) {
        errorToast(response.message ?? "Error occurred during logout");
      } else {
        await signOut();
      }
    } catch (error) {
      errorToast("Failed to log out");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = useCallback(async () => {
    if (!isEdit) {
      setIsEdit(true);
      return;
    }

    // Save changes on home items ordering
    setLoading(true);
    try {
      console.log({ homeItems });
      const response = await ApiRequest({
        url: "/api/home",
        method: "PUT",
        data: {
          ty: "order",

          orderItems: homeItems.map((item, idx) => ({ id: item.id, idx })),
        },
      });

      if (!response.success) {
        errorToast("Failed to update items");
        return;
      }

      setIsEdit(false);
      router.refresh();
    } catch (error) {
      errorToast("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [homeItems, isEdit, router]);

  const handleDelete = useCallback(async () => {
    if (!selected.length) {
      errorToast("No item selected");
      return;
    }

    const itemIdsToDelete = selected.map((idx) => homeItems[idx].id);

    const deleteItems = async () => {
      try {
        const response = await ApiRequest({
          url: "/api/home",
          method: "DELETE",
          data: { id: itemIdsToDelete },
        });

        if (!response.success) {
          errorToast(response.message ?? "Failed to delete items");
          return;
        }

        const updatedItems = homeItems.filter(
          (item) => !itemIdsToDelete.includes(item.id)
        );
        setHomeItems(updatedItems);
        setSelected([]);
        setIsEdit(false);
        successToast("Items deleted successfully");
      } catch (error) {
        errorToast("Failed to delete items");
        console.error(error);
      }
    };

    await Delayloading(deleteItems, setLoading, 500);
  }, [homeItems, selected]);

  const handleSelectItem = useCallback((idx: number) => {
    setSelected((prev) => {
      const existingIndex = prev.indexOf(idx);
      if (existingIndex !== -1) {
        // Remove item if already selected
        return prev.filter((i) => i !== idx);
      } else {
        // Add item to selection
        return [...prev, idx];
      }
    });
  }, []);

  const handleMenuItemClick = useCallback(
    (link: string) => {
      if (link) {
        router.push(link);
        router.refresh();
        if (isMobile) setProfile(false);
      } else {
        setopenmodal((prev) => ({ ...prev, editHome: true }));
      }
    },
    [isMobile, router, setProfile, setopenmodal]
  );

  const handleToggleHomeItemEdit = useCallback(() => {
    if (isEdit) handleDelete();
    else setopenmodal({ mangageHomeItem: true });
  }, [handleDelete, isEdit, setopenmodal]);

  const renderHomeEditor = () => (
    <div className="w-[90%] h-full flex flex-col items-center gap-y-8 py-6">
      <button
        onClick={() => setopenmodal((prev) => ({ ...prev, editHome: false }))}
        className="w-full h-fit flex items-center gap-x-2 text-left text-lg font-medium cursor-pointer transition-colors hover:text-blue-600 pl-2"
      >
        <span className="text-xl">&larr;</span>
        <span>Back to Menu</span>
      </button>

      <div className="w-full flex-1 overflow-y-auto px-2">
        <Homeeditmenu
          isEdit={isEdit}
          onEdit={handleSelectItem}
          items={homeItems}
          setItems={setHomeItems}
        />
      </div>

      <div className="w-full flex flex-row gap-x-4 justify-between px-2">
        <PrimaryButton
          type="button"
          text={isEdit ? "Delete Selected" : "Add New Item"}
          color={isEdit ? "rgb(255, 107, 107)" : "white"}
          height="54px"
          width="48%"
          hoverColor={isEdit ? "rgb(255, 77, 77)" : "rgb(245, 245, 245)"}
          textcolor={isEdit ? "white" : "black"}
          status={loading ? "loading" : "authenticated"}
          disable={isEdit && selected.length === 0}
          radius="12px"
          border={isEdit ? "none" : "1px solid rgb(230, 230, 230)"}
          onClick={handleToggleHomeItemEdit}
          Icon={isEdit ? <Bin_Icon /> : <AddIcon />}
        />

        <PrimaryButton
          type="button"
          onClick={handleEdit}
          text={isEdit ? "Save Changes" : "Edit Order"}
          radius="12px"
          height="54px"
          hoverColor={isEdit ? "rgb(72, 187, 120)" : "rgb(245, 245, 245)"}
          width="48%"
          border={isEdit ? "none" : "1px solid rgb(230, 230, 230)"}
          color={isEdit ? "rgb(72, 187, 120)" : "white"}
          textcolor={isEdit ? "white" : "black"}
          Icon={
            <div
              className={`w-[24px] h-[24px] ${
                isEdit ? "text-white" : ""
              } rounded-full flex items-center justify-center`}
            >
              <PencilEditIcon />
            </div>
          }
        />
      </div>
    </div>
  );

  const renderMainMenu = () => (
    <div className="flex flex-col items-center w-full h-full py-8">
      <div className="w-full px-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Menu</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage your profile and preferences
        </p>
      </div>

      <nav className="w-full flex-1 overflow-y-auto px-6">
        <ul className="flex flex-col w-full gap-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.name} className="w-full">
              <button
                onClick={() => handleMenuItemClick(item.link)}
                className="w-full py-3.5 flex items-center gap-x-4 px-5 rounded-xl
                         text-left transition-all duration-200 bg-white
                         hover:bg-gray-50 active:bg-gray-100 focus:outline-none
                         focus:ring-2 focus:ring-blue-200 group"
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                  {item.icon}
                </span>
                <span className="text-base font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="w-full px-6 mt-4 pt-4 border-t border-gray-100">
        <PrimaryButton
          text="Sign Out"
          type="button"
          color="rgb(255, 107, 107)"
          width="100%"
          height="54px"
          status={loading ? "loading" : "authenticated"}
          radius="12px"
          textcolor="white"
          hoverColor="rgb(255, 77, 77)"
          onClick={handleSignOut}
        />

        <p className="text-xs text-center mt-4 text-gray-500">
          &copy; {new Date().getFullYear()} SrokSre. All rights reserved.
        </p>
      </div>
    </div>
  );

  return (
    <motion.aside
      ref={ref}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onMouseEnter={() => setProfile(true)}
      className="fixed right-0 top-0 w-[430px] max-small_phone:w-full h-full z-[99] bg-white shadow-xl flex flex-col overflow-hidden"
    >
      {openmodal?.editHome ? renderHomeEditor() : renderMainMenu()}

      {isMobile && (
        <button
          type="button"
          onClick={() => setProfile(false)}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center 
                   rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close menu"
        >
          <CloseVector width="16px" height="16px" />
        </button>
      )}
    </motion.aside>
  );
}

interface cardmenuprops {
  img: string | StaticImageData;
  setcart: (value: SetStateAction<boolean>) => void;
}

export function CartMenu(props: cardmenuprops) {
  const { setreloadcart, reloadcart } = useGlobalContext();
  const router = useRouter();
  const searchparams = useSearchParams();
  const [cartItem, setitem] = useState<Array<Productordertype> | []>([]);

  const ref = useClickOutside(() => props.setcart(false));

  const [loading, setloading] = useState({
    fetch: true,
    checkout: false,
  });

  const [totalprice, settotal] = useState<totalpricetype | undefined>(
    undefined
  );

  // Prevent background scrolling when menu is open
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const fetchcart = useCallback(async () => {
    const asyncfetchcart = async () => {
      const response = await ApiRequest({
        url: "/api/order/cart",
        method: "GET",
      });

      if (response.success) {
        setitem(response.data as Array<Productordertype>);
        settotal({ subtotal: response.total ?? 0, total: response.total ?? 0 });
      }
    };

    await Delayloading(
      asyncfetchcart,
      (value) => setloading((prev) => ({ ...prev, fetch: value })),
      500
    );

    setreloadcart(false);
  }, [setreloadcart]);

  useEffect(() => {
    if (reloadcart) fetchcart();
  }, [fetchcart, reloadcart]);

  const removecart = useCallback(
    async (id: number) => {
      const deletereq = await ApiRequest({
        url: "/api/order/cart",
        method: "DELETE",
        data: { id },
      });
      if (!deletereq.success) {
        errorToast("Can't Delete Cart");
        return;
      }
      router.refresh();
      setreloadcart(true);
    },
    [router, setreloadcart]
  );

  const subprice = useMemo(() => {
    return totalprice
      ? parseFloat(totalprice.subtotal.toString()).toFixed(2)
      : "0.00";
  }, [totalprice]);

  const handleCheckout = useCallback(async () => {
    const params = new URLSearchParams(searchparams);

    if (!cartItem || cartItem.length === 0) {
      errorToast("No items in cart");
      return;
    }

    if (totalprice && cartItem.length !== 0) {
      const makereq = Createorder.bind(null, {
        price: totalprice,
      });
      setloading((prev) => ({ ...prev, checkout: true }));
      const createOrder = await makereq();
      setloading((prev) => ({ ...prev, checkout: false }));

      if (!createOrder.success) {
        console.log({ createOrder });
        errorToast(createOrder.message ?? "Error Occurred");
        return;
      }

      params.set("orderid", createOrder?.data?.orderId ?? "");
      params.set("step", "1");
      router.push(`/checkout?${params.toString()}`);
    }
  }, [cartItem, totalprice, searchparams, router]);

  const isEmpty = !cartItem || cartItem.length === 0;

  return (
    <motion.aside
      ref={ref}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onMouseEnter={() => props.setcart(true)}
      className="fixed right-0 top-0 w-[700px] max-large_tablet:w-[550px] max-large_phone:w-full 
                 h-full z-40 bg-white shadow-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">
            {cartItem?.length || 0} {cartItem?.length === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={() => props.setcart(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full 
                     bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close cart"
        >
          <CloseVector width="16px" height="16px" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!loading.fetch && isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fa-solid fa-shopping-cart text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some items to get started</p>
          </div>
        )}

        {loading.fetch && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        )}

        {!loading.fetch && !isEmpty && (
          <div className="space-y-4">
            {cartItem.map((item, idx) => (
              <SecondayCard
                key={item.id || idx}
                id={item.id}
                img={
                  item.product?.covers.length !== 0
                    ? (item.product?.covers[0].url as string)
                    : props.img
                }
                name={item.product?.name ?? ""}
                maxqty={item.maxqty}
                price={{
                  price: item.product?.price ?? 0,
                  discount: item.product?.discount,
                }}
                selectedqty={item.quantity}
                selecteddetail={item.selectedvariant}
                removecart={() => removecart(item.id)}
                settotal={settotal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-700">
                Subtotal
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ${subprice}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Shipping and taxes calculated at checkout
            </p>
          </div>

          <PrimaryButton
            type="button"
            text="Proceed to Checkout"
            onClick={handleCheckout}
            disable={isEmpty}
            width="100%"
            height="54px"
            radius="12px"
            status={loading.checkout ? "loading" : "authenticated"}
          />
        </div>
      )}
    </motion.aside>
  );
}

interface Subinventorymenuprops {
  data: Array<SelectType> | Readonly<Array<SelectType>>;
  open?: string;
  type?: "product" | "banner" | "promotion";
  index?: number;
  style?: CSSProperties;
  stock?: number;
  stocktype?: string;
  stockaction?: () => void;
  reloaddata?: () => void;
}

export const SubInventoryMenu = memo((props: Subinventorymenuprops) => {
  const {
    openmodal,
    setopenmodal,
    setglobalindex,
    setproduct,
    setbanner,
    setpromotion,
  } = useGlobalContext();
  const router = useRouter();

  const handleClick = (obj: SelectType) => {
    const index = props.index as number;

    if (
      props.type === "product" ||
      props.type === "banner" ||
      props.type === "promotion"
    ) {
      if (obj.value === InventoryAction.EDIT) {
        setglobalindex((previndex) => ({
          ...previndex,
          [props.type === "product"
            ? "producteditindex"
            : props.type === "banner"
            ? "bannereditindex"
            : "promotioneditindex"]: index,
        }));
        if (props.type === "product") {
          router.push(`/dashboard/inventory/createproduct/${index}`);
        } else setopenmodal({ ...openmodal, [obj.value as string]: true });
      } else if (obj.value === InventoryAction.STOCK && props.stockaction) {
        if (props.stocktype?.includes("stock"))
          setproduct((prev) => ({ ...prev, stock: props.stock }));
        props.stockaction();
      } else {
        setopenmodal((prev) => ({
          ...prev,
          confirmmodal: {
            ...prev.confirmmodal,
            index: index,
            type: props.type,
            open: true,
            onDelete: () => {
              if (props.reloaddata) props.reloaddata();
            },
          },
        }));
      }
    } else {
      if (obj.value === "createProduct") {
        setproduct(Productinitailizestate);
        setglobalindex((prev) => ({ ...prev, producteditindex: -1 }));
        router.push("/dashboard/inventory/createproduct/0");
      } else if (obj.value === "createBanner") {
        setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));
        setbanner(BannerInitialize);
      } else if (obj.value === "createPromotion") {
        setpromotion(PromotionInitialize);
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
      }

      if (obj.value !== "createProduct")
        setopenmodal({ ...openmodal, [obj.value as string]: true });
    }
  };
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          color={props.type ? "default" : "success"}
          variant="solid"
          endContent={
            !props.type ? (
              <i className="fa-solid fa-plus text-sm font-bold text-white"></i>
            ) : undefined
          }
          style={props.type ? { minWidth: "20px" } : {}}
          className="font-bold text-white min-w-[150px]"
        >
          {props.type ? (
            <i className="fa-solid fa-ellipsis-vertical text-lg text-black  w-fit h-fit p-2 transition hover:bg-gray-300"></i>
          ) : (
            "Create"
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Dynamic Actions" items={props.data}>
        {(item) => (
          <DropdownItem key={item.value} onPress={() => handleClick(item)}>
            {item.label}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
});
SubInventoryMenu.displayName = "SubInventoryMenu";
