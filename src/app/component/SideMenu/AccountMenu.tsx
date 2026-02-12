"use client";
import React, {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PrimaryButton from "../Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useClickOutside,
  useScreenSize,
} from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import { Homeitemtype } from "../../severactions/containeraction";
import { Homeeditmenu } from "../HomePage/EditMenu";
import { Addicon } from "../Icons/Homepage";
import { Usersessiontype } from "@/src/types/user.type";
import {
  Bin_Icon,
  CloseVector,
  EditIcon,
  InventoryIcon,
  OrderIcon,
  PencilEditIcon,
  ProfileIcon,
  UserIcon,
} from "../Asset";
import { CheckAndGetUserInfo } from "../../severactions/RecapchaAction";

interface AccountMenuProps {
  setProfile: (value: SetStateAction<boolean>) => void;
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

export default function AccountMenu({ setProfile }: AccountMenuProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [usersession, setusersession] = useState<Usersessiontype | null>(
    session as never,
  );
  const memorizedStatus = useMemo(() => status, [status]);
  const { openmodal, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [Homeitems, sethomeitems] = useState<Homeitemtype[]>([]);
  const [isEdit, setisEdit] = useState(false);
  const [selected, setselected] = useState<number[] | undefined>([]);
  const router = useRouter();
  const ref = useClickOutside(() => setProfile(false));
  const { isMobile } = useScreenSize();

  //Verify User Session
  const verifyUserSession = useCallback(async () => {
    setloading(true);
    try {
      const makeReq = CheckAndGetUserInfo.bind(null, {});
      const isSession = await makeReq();

      if (!isSession.success) {
        errorToast(isSession.message ?? "Error occured");
        if (isSession.isExpire) {
          // await signOut({ redirect: false });
          // errorToast(isSession.message, {
          //   onClose: () => window.location.reload(),
          //   closeOnClick: true,
          // });
        }
        return;
      }

      setusersession((prev) => ({ ...prev, ...isSession.data }) as never);
    } finally {
      setloading(false);
    }
  }, []);

  useEffect(() => {
    if (memorizedStatus === "authenticated") {
      verifyUserSession();
    }

    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, [memorizedStatus, verifyUserSession]);

  const handleSignOut = useCallback(async () => {
    setloading(true);
    await signOut();
    setloading(false);
  }, []);

  const handleEdit = useCallback(async () => {
    if (!isEdit) {
      setisEdit(true);
    } else {
      setloading(true);
      const updateidx = await ApiRequest(
        "/api/home",
        undefined,
        "PUT",
        "JSON",
        {
          ty: "idx",
          edititems: Homeitems.map((i, idx) => ({ id: i.id, idx })),
        },
      );

      setloading(false);
      if (!updateidx.success) {
        errorToast("Error Occurred");
        return;
      }

      setisEdit(false);
      router.refresh();
    }
  }, [isEdit, Homeitems, router]);

  const handleDelete = useCallback(async () => {
    if (!selected?.length) {
      errorToast("No item selected");
      return;
    }
    const homeitem_id = selected.map((idx) => Homeitems[idx].id);

    const deleteItemsAsync = async () => {
      const deletereq = await ApiRequest(
        "/api/home",
        undefined,
        "DELETE",
        "JSON",
        {
          id: homeitem_id,
        },
      );

      if (!deletereq.success) {
        errorToast(deletereq.message ?? "Error Occurred");
        return;
      }

      const updatedItems = Homeitems.filter((i) => !homeitem_id.includes(i.id));
      sethomeitems(updatedItems);
      setselected(undefined);
      setisEdit(false);
      successToast("Deleted Successfully");
    };

    await Delayloading(deleteItemsAsync, setloading, 500);
  }, [selected, Homeitems]);

  const handleOnEdit = useCallback((idx: number) => {
    setselected((prev) => {
      const updateselected = [...(prev ?? [])];
      const isExist = updateselected.findIndex((i) => i === idx);
      if (isExist !== -1) {
        updateselected.splice(isExist, 1);
      } else {
        updateselected.push(idx);
      }
      return updateselected;
    });
  }, []);

  const filteredMenuItems = useMemo(
    () =>
      AccountMenuItems.filter((i) =>
        pathname !== "/" ? i.name !== AccountMenuItems[4].name : true,
      ).filter((i) => (usersession?.role === "ADMIN" ? i.isAdmin : i.isUser)),
    [pathname, usersession?.role],
  );

  // Memoize callbacks to prevent MenuItem re-renders
  const handleEditHomeClick = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, editHome: true }));
  }, [setopenmodal]);

  const handleNavigate = useCallback(
    (link: string) => {
      router.push(link);
      router.refresh();
      isMobile && setProfile(false);
    },
    [router, isMobile, setProfile],
  );

  return (
    <motion.aside
      ref={ref}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onMouseEnter={() => setProfile(true)}
      className="fixed right-0 top-0 w-[430px] max-small_phone:w-full h-full z-[99] bg-white shadow-2xl flex flex-col items-center border-l border-gray-200"
    >
      {status === "loading" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-y-6 px-6">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading account...</p>
        </div>
      ) : openmodal?.editHome ? (
        <div className="w-[90%] h-full flex flex-col items-center gap-y-10 pt-8">
          <h3
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, editHome: false }))
            }
            className="w-full h-fit text-left text-lg font-semibold cursor-pointer transition-colors duration-200 hover:text-blue-600 active:text-blue-700 pl-2 flex items-center gap-x-2"
          >
            {`< Back`}
          </h3>
          <Homeeditmenu
            isEdit={isEdit}
            onEdit={handleOnEdit}
            items={Homeitems}
            setItems={sethomeitems}
          />
          <div className="w-full h-[40px] flex flex-row gap-x-5 justify-start">
            <PrimaryButton
              type="button"
              text={isEdit ? "Delete" : "Add New"}
              color={isEdit ? "lightcoral" : "white"}
              height="50px"
              width="100%"
              hoverColor="lightgray"
              textcolor={isEdit ? "white" : "black"}
              status={loading ? "loading" : "authenticated"}
              disable={isEdit && selected?.length === 0}
              radius="10px"
              border="1px solid lightgray"
              onClick={() =>
                isEdit
                  ? handleDelete()
                  : setopenmodal((prev) => ({ ...prev, homecontainer: true }))
              }
              Icon={isEdit ? <Bin_Icon /> : <Addicon />}
            />

            <PrimaryButton
              type="button"
              onClick={() => handleEdit()}
              text={isEdit ? "Done" : "Edit"}
              radius="10px"
              height="50px"
              hoverColor="lightgray"
              width="100%"
              border="1px solid lightgray"
              color="white"
              textcolor="black"
              Icon={
                <div className="w-[30px] h-[30px] bg-white rounded-full">
                  <PencilEditIcon />
                </div>
              }
            />
          </div>
        </div>
      ) : (
        <>
          <div className="w-full flex flex-col items-center pt-8 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              {usersession?.user.email || "User"}
            </h2>
            <p className="text-sm text-gray-500 capitalize">
              {usersession?.role || "Member"}
            </p>
          </div>
          <ul className="menu_container flex flex-col items-center w-full gap-y-3 mt-8 mb-8 px-6">
            {filteredMenuItems.map((item) => (
              <MenuItem
                key={item.name}
                item={item}
                onEditHomeClick={handleEditHomeClick}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
          <div className="w-full px-6 mt-auto mb-8">
            <PrimaryButton
              text="Logout"
              type="button"
              color="#EF4444"
              width="100%"
              status={loading ? "loading" : "authenticated"}
              radius="12px"
              hoverColor="#DC2626"
              textcolor="white"
              onClick={() => handleSignOut()}
            />
          </div>
        </>
      )}
      {isMobile && (
        <div
          onClick={() => setProfile(false)}
          className="w-10 h-10 absolute top-4 right-4 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
        >
          <CloseVector width="24px" height="24px" />
        </div>
      )}
    </motion.aside>
  );
}

// Memoized MenuItem component to prevent unnecessary re-renders
interface MenuItemProps {
  item: (typeof AccountMenuItems)[0];
  onEditHomeClick: () => void;
  onNavigate: (link: string) => void;
}

const MenuItem = React.memo(
  ({ item, onEditHomeClick, onNavigate }: MenuItemProps) => {
    const handleClick = useCallback(() => {
      if (item.link === "") {
        onEditHomeClick();
      } else {
        onNavigate(item.link);
      }
    }, [item.link, onEditHomeClick, onNavigate]);

    return (
      <li className="side_link w-full h-[56px] text-center rounded-xl transition-all duration-200">
        <div
          onClick={handleClick}
          className="w-full h-full flex flex-row items-center cursor-pointer gap-x-4 px-4 rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="transition-transform duration-200 group-hover:scale-110">
            {item.icon}
          </div>
          <h3 className="text-base font-semibold text-gray-700 group-hover:text-gray-900">
            {item.name}
          </h3>
        </div>
      </li>
    );
  },
);

MenuItem.displayName = "MenuItem";
