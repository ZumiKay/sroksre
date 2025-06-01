import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import {
  CateogoryState,
  NotificationType,
  Sessiontype,
} from "@/src/context/GlobalType.type";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadingIcon, { errorToast } from "../Loading";
import Link from "next/link";
import { CircularProgress } from "@heroui/react";
import { CloseVector } from "../Asset";

export const CategoriesContainer = (props: {
  setopen: (val: boolean) => void;
}) => {
  const [allcate, setallcate] = useState<Array<CateogoryState>>();
  const [loading, setloading] = useState(true);
  const { isMobile } = useScreenSize();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const fetchcate = async () => {
      const request = await ApiRequest({
        url: "/api/categories",
        method: "GET",
      });
      if (request.success) {
        setallcate(request.data as Array<CateogoryState>);
      }
      setloading(false);
    };
    fetchcate();
  }, []);

  const handleCateClick = useCallback(
    ({ type, id }: { type: string; id: number }) => {
      router.push(`/product?${type === "normal" ? `pid=${id}` : `ppid=${id}`}`);
      if (isMobile) props.setopen(false);
    },
    [isMobile, props, router]
  );

  const handleSubCateClick = useCallback(
    ({ type, id, pid }: { type: string; id: number; pid?: number }) => {
      router.push(
        `/product?pid=${id}${
          type === "normal" ? `&cid=${id}` : `&promoid=${pid}`
        }`
      );
      if (isMobile) props.setopen(false);
    },
    [isMobile, props, router]
  );
  return (
    <div
      onMouseLeave={() => props.setopen(false)}
      className="categories__container absolute top-[57px] z-[99] 
    w-full h-full min-h-[50vh] max-h-screen
    flex flex-row flex-wrap items-start justify-start gap-5
    bg-[#F3F3F3] overflow-x-hidden
    max-large_phone:justify-center 
    max-small_phone:h-screen max-small_phone:pb-20"
    >
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <LoadingIcon />
        </div>
      ) : (
        <div className="flex flex-row flex-wrap items-start justify-start gap-5 w-full px-4 py-6">
          {/* Main categories */}
          {allcate
            ?.filter((i) => i.type !== "latest")
            .map((category) => (
              <div
                key={category.id}
                className="category flex flex-col items-center justify-start 
              w-[200px] pt-6 p-1
              max-small_phone:w-[90%]"
              >
                <h3
                  onClick={() =>
                    category.type &&
                    category.id &&
                    handleCateClick({ type: category.type, id: category.id })
                  }
                  className="category_header w-full h-fit p-3
                bg-[#495464] text-white
                font-medium text-center break-words rounded-md
                transition-colors duration-200 cursor-pointer
                hover:bg-white hover:text-black 
                active:bg-white active:text-black"
                >
                  {category.name}
                </h3>

                <div
                  className="category_subheader w-full h-fit pt-5 
              flex flex-col gap-y-4 
              font-normal text-center"
                >
                  {category.subcategories
                    ?.filter((sub) => (sub.isExpired ? !sub.isExpired : true))
                    .map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() =>
                          sub.type &&
                          sub.id &&
                          handleSubCateClick({
                            type: sub.type,
                            id: sub.id,
                            pid: sub.pid,
                          })
                        }
                        className="py-1 px-2 rounded-sm hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                      >
                        <h4 className="subcategory">{sub.name}</h4>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          {/* Special categories (latest/popular) */}
          <div
            className="category flex flex-col items-center justify-start 
        w-[200px] h-fit pt-6 p-1 gap-y-4
        max-small_phone:w-[90%]"
          >
            {allcate
              ?.filter((i) => i.type === "latest" || i.type === "popular")
              .map((item, idx) => (
                <h3
                  key={idx}
                  onClick={() => router.push(`/product?pid=${item.id}`)}
                  className="category_header w-full h-fit p-3
                bg-[#495464] text-white
                font-medium text-center break-words rounded-md
                transition-colors duration-200 cursor-pointer
                hover:bg-white hover:text-black 
                active:bg-white active:text-black"
                >
                  {item.name}
                </h3>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function DashboordNavBar({ session }: { session?: Sessiontype }) {
  const route = usePathname();

  return (
    <nav className="dashboardNav__container flex flex-row w-full items-center justify-evenly bg-[#F3F3F3] h-[70px]">
      <Link href={"/dashboard"}>
        <p
          className={`navlink ${
            route === "/dashboard" ? "activelink" : ""
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
        >
          My Profile{" "}
        </p>
      </Link>{" "}
      <Link href={"/dashboard/order"}>
        <p
          className={`navlink ${
            route === "/dashboard/order" ? "activelink" : ""
          } text-lg font-bold bg-white w-fit p-2 transition text-center rounded-md`}
        >
          {session?.role === "ADMIN" ? "Order Mangement" : "My Order"}
        </p>
      </Link>
      <Link hidden={session?.role !== "ADMIN"} href={"/dashboard/inventory"}>
        <p
          className={`navlink ${
            route === "/dashboard/inventory" ? "activelink" : ""
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
        >
          Inventory
        </p>
      </Link>
      <Link
        hidden={session?.role !== "ADMIN"}
        href={"/dashboard/usermanagement"}
      >
        <p
          className={`navlink ${
            route === "/dashboard/usermanagement" ? "activelink" : ""
          } text-lg font-bold bg-white w-[200px] p-2 transition text-center rounded-md`}
        >
          User Management
        </p>
      </Link>
    </nav>
  );
}

export const NotificationMenu = ({
  notification,
  close,
}: {
  notification?: NotificationType[];
  close: () => void;
}) => {
  const [notifydata, setnotifydata] = useState<NotificationType[]>([]);
  const [loading, setloading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadmore, setloadmore] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const notioffset = 3;

  // Fetch notifications
  useEffect(() => {
    const getAllNotification = async () => {
      setloading(true);
      try {
        const result = await ApiRequest({
          url: `/api/users/notification?ty=detail&p=${page}&lt=${notioffset}`,
          method: "GET",
        });

        if (result.success && result.data) {
          const data = result.data as NotificationType[];

          // Update notification data
          setnotifydata((prevData) => {
            const combinedData = [...prevData];

            // Add initial notifications if provided
            if (page === 1 && notification?.length) {
              combinedData.push(...notification);
            }

            // Add newly fetched data
            combinedData.push(...data);

            return combinedData;
          });

          // Check if there's more data to load
          if (data.length === 0) {
            setloadmore(false);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setloading(false);
      }
    };

    getAllNotification();
  }, [page, notification]);

  // Handle body overflow
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!ref.current || loading || !loadmore) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

    if (isAtBottom) {
      setPage((prev) => prev + 1);
    }
  }, [loading, loadmore]);

  // Mark notification as checked
  const handleChecked = useCallback(async (id: number) => {
    try {
      await ApiRequest({
        url: "/api/users/notification",
        method: "PUT",
        data: { id, check: true },
      });

      // Optionally update local state to reflect the checked status
      setnotifydata((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: true } : item))
      );
    } catch (error) {
      console.error("Error marking notification as checked:", error);
    }
  }, []);

  // Delete notification
  const handleDelete = useCallback(async (id: number) => {
    const response = await ApiRequest({
      url: "/api/users/notification",
      method: "DELETE",
      data: { id },
    });

    if (response.success) {
      setnotifydata((prev) => prev.filter((item) => item.id !== id));
    } else {
      errorToast(response.message as string);
    }
  }, []);

  const hasNotifications = notifydata.length > 0;

  return (
    <aside
      ref={ref}
      onScroll={handleScroll}
      className="notification absolute w-[350px] h-[400px] z-[150] right-2 top-14 flex flex-col gap-x-5 bg-white rounded-lg overflow-x-hidden overflow-y-auto max-smallest_tablet:right-0 max-smallest_tablet:top-0 max-smallest_tablet:w-[100vw] max-smallest_tablet:h-[100vh]"
    >
      <div
        onClick={close}
        className="w-fit h-fit hidden max-smallest_tablet:block absolute top-1 right-2 z-50"
      >
        <CloseVector width="30px" height="30px" />
      </div>

      <h3 className="font-bold bg-white text-lg w-full sticky top-0 z-10 text-left p-2 border-b-2 border-b-gray-300">
        Notifications
      </h3>

      <div className="w-full h-full flex flex-col gap-y-5 relative">
        {!hasNotifications && !loading ? (
          <p className="font-normal text-sm w-full h-fit text-center pt-2">
            No Notifications
          </p>
        ) : (
          notifydata.map((notification) => (
            <div key={notification.id} className="w-full h-full relative">
              <Link href={notification.link ?? ""}>
                <div
                  onTouchStart={() => handleChecked(notification.id as number)}
                  onMouseEnter={() => handleChecked(notification.id as number)}
                  className="notification_item relative w-full h-fit flex flex-col gap-y-5 p-3 transition cursor-pointer hover:bg-gray-300"
                >
                  {!notification.checked && (
                    <span className="w-[10px] h-[10px] bg-red-500 rounded-xl absolute right-2"></span>
                  )}
                  <p className="font-bold text-lg">{notification.type}</p>
                  <p>{notification.content}</p>
                  <p className="text-[12px]">{notification.createdAt}</p>
                </div>
              </Link>
              <i
                onClick={() => handleDelete(notification.id as number)}
                className={`fa-solid fa-trash relative w-full left-[90%] transition duration-300 active:text-white ${
                  loading ? "animate-spin" : ""
                }`}
              ></i>
            </div>
          ))
        )}

        {loading && <CircularProgress />}
      </div>
    </aside>
  );
};
