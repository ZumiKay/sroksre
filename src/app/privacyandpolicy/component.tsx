"use client";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "../component/Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Addquestiontype } from "./action";
import { errorToast, successToast } from "../component/Loading";
import { TabArrow } from "../component/Asset";
import { Button } from "@heroui/react";
import {
  ApiRequest,
  useCheckSession,
  useClickOutside,
  useScreenSize,
} from "@/src/context/CustomHook";
import MenuIcon from "@mui/icons-material/Menu";
import CancelIcon from "@mui/icons-material/Cancel";
import { AddPolicyModal } from "../component/Modals/CreatePolicyModal";
import { Typeofpolicy } from "@/src/context/GlobalType.type";

interface sidebarContentType {
  id: number;
  title: string;
}

export const SidePolicyBar = memo(
  ({
    data = [],
    page,
    handleNavigate,
  }: {
    data: sidebarContentType[];
    page?: number;
    handleNavigate?: (key: number) => void;
  }) => {
    const { user } = useCheckSession();
    const { setopenmodal } = useGlobalContext();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useClickOutside(() => setIsOpen(false));
    const { isMobile, isTablet } = useScreenSize();
    const isDesktop = useMemo(
      () => !isTablet && !isMobile,
      [isMobile, isTablet]
    );

    // Close sidebar when window resizes to larger viewports
    useEffect(() => {
      if (!isMobile && !isTablet) {
        setIsOpen(false);
      }
    }, [isMobile, isTablet]);

    const toggleSidebar = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    };

    // Sidebar variants for animations
    const sidebarVariants = useMemo(() => {
      return {
        open: {
          x: 0,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          },
        },
        closed: {
          x: "-100%",
          boxShadow: "none",
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          },
        },
      };
    }, []);
    const overlayVariants = useMemo(() => {
      return {
        open: {
          opacity: 1,
          display: "block",
          transition: { duration: 0.2 },
        },
        closed: {
          opacity: 0,
          transition: { duration: 0.2 },
          transitionEnd: { display: "none" },
        },
      };
    }, []);

    // Overlay variants

    // Make sure we have data to render
    if (!data || data.length === 0) {
      return (
        <div className="p-4 text-gray-500 border rounded-lg">
          No policy items available
        </div>
      );
    }

    return (
      <>
        {/* Hamburger button - visible only on mobile/tablet */}
        {!isDesktop && (
          <button
            onClick={toggleSidebar}
            className="fixed bottom-[5%] right-1 z-50 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-full w-10 h-10 flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? (
              <CancelIcon
                fontSize="small"
                className="text-gray-700 dark:text-gray-200"
              />
            ) : (
              <MenuIcon
                fontSize="small"
                className="text-gray-700 dark:text-gray-200"
              />
            )}
          </button>
        )}

        <AnimatePresence>
          {(isMobile || isTablet) && isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          ref={isDesktop ? null : ref}
          initial={isDesktop ? "open" : "closed"}
          animate={isDesktop || isOpen ? "open" : "closed"}
          variants={!isDesktop ? sidebarVariants : undefined}
          className={`
          h-fit w-[300px] bg-incart 
          flex flex-col 
          ${!isDesktop ? "fixed left-0 top-0 bottom-0 z-50" : ""}
          ${isDesktop ? "" : ""}
          border-r border-gray-100 dark:border-gray-700 lg:border-none
        `}
        >
          <div className="px-4 py-6 lg:py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Policies
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {data.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNavigate && handleNavigate(item.id)}
                  className={`
                  py-2.5 px-4 rounded-lg text-base font-medium
                  transition-all duration-200 select-none 
                  hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer
                  ${
                    page?.toString() === item.id.toString()
                      ? "bg-white text-black font-semibold"
                      : "text-white"
                  }
                `}
                >
                  {item.title}
                </div>
              ))}
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <div className="mt-auto p-4 border-t border-gray-100">
              <Button
                onPress={() =>
                  setopenmodal((prev) => ({ ...prev, addpolicy: true }))
                }
                type="button"
                style={{ width: "100%" }}
                size="md"
                className="flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow bg-white"
                startContent={<span className="text-lg">+</span>}
              >
                Add New Policy
              </Button>
            </div>
          )}
        </motion.aside>
      </>
    );
  }
);
SidePolicyBar.displayName = "SidePolicyBar";

const deleteRequest = async (id: number, type: Typeofpolicy) => {
  const makeReq = await ApiRequest({
    url: `/api/policy?ty=${type}id=${id}`,
    method: "DELETE",
  });

  if (makeReq.success) {
    successToast(makeReq.message as string);
  } else {
    errorToast(makeReq.message as string);
  }
};

//Question card animation
const questioncardAnimation = {
  open: {
    height: "100%",
  },
  closed: {
    height: "100%",
  },
};

export const QuestionCard = memo(
  ({
    isAdmin,
    idx,
    data,
    isEdit,
  }: {
    isAdmin?: boolean;
    isEdit?: boolean;
    idx: number;
    data: Addquestiontype;
  }) => {
    const openstate = `policyQ${idx}`;
    const { openmodal, setopenmodal } = useGlobalContext();
    const [open, setopen] = useState(false);

    const handleConfirmDelete = useCallback(() => {
      setopenmodal({
        confirmmodal: {
          open: true,
          onAsyncDelete: deleteRequest(data.id ?? 0, "question") as never,
        },
      });
    }, [data.id, setopenmodal]);

    return (
      <>
        <motion.div
          variants={questioncardAnimation}
          initial="closed"
          animate={open ? "open" : "closed"}
          className="questioncard w-full  p-3 border-t-2 border-gray-300 flex flex-col items-start gap-y-5"
        >
          <div className="w-full h-fit flex flex-row justify-between items-center">
            <label className="text-lg font-medium w-full">
              {data.question}
            </label>
            <div className="w-[50px] " onClick={() => setopen(!open)}>
              <TabArrow width="30" height="30" type={open ? "up" : "down"} />
            </div>
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="answer w-full"
              >
                {data.answer}
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && isEdit && (
            <div className="btn_con flex flex-row items-center gap-x-5">
              <PrimaryButton
                text="Edit"
                type="button"
                radius="10px"
                color="#4688A0"
                onClick={() =>
                  setopenmodal((prev) => ({ ...prev, [openstate]: true }))
                }
              />
              <PrimaryButton
                text="Delete"
                type="button"
                radius="10px"
                onClick={() => handleConfirmDelete()}
                color="lightcoral"
              />
            </div>
          )}
        </motion.div>
        {openmodal[openstate] && (
          <AddPolicyModal qa={[data]} edit={true} openstate={openstate} />
        )}
      </>
    );
  }
);
QuestionCard.displayName = "QuestionCard";
