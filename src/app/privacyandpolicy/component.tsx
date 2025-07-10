"use client";
import { motion, AnimatePresence } from "framer-motion";
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
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          transition: {
            type: "spring",
            stiffness: 350,
            damping: 25,
            duration: 0.3,
          },
        },
        closed: {
          x: "-100%",
          boxShadow: "none",
          transition: {
            type: "spring",
            stiffness: 350,
            damping: 25,
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

    // Make sure we have data to render
    if (!data || data.length === 0) {
      return (
        <div className="p-6 text-gray-500 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-center">
          <p className="text-sm font-medium">No policy items available</p>
        </div>
      );
    }

    return (
      <>
        {/* Hamburger button - enhanced for better UX */}
        {!isDesktop && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="fixed bottom-6 right-4 z-50 p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            aria-label={
              isOpen ? "Close navigation menu" : "Open navigation menu"
            }
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <CancelIcon fontSize="small" className="text-white" />
              ) : (
                <MenuIcon fontSize="small" className="text-white" />
              )}
            </motion.div>
          </button>
        )}

        <AnimatePresence>
          {(isMobile || isTablet) && isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          ref={isDesktop ? null : ref}
          initial={isDesktop ? "open" : "closed"}
          animate={isDesktop || isOpen ? "open" : "closed"}
          variants={!isDesktop ? sidebarVariants : undefined}
          className={`
            h-fit w-[320px] bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
            flex flex-col 
            ${!isDesktop ? "fixed left-0 top-0 bottom-0 z-50" : ""}
            border-r border-gray-200 dark:border-gray-700
            ${isDesktop ? "sticky top-0" : ""}
          `}
          role="navigation"
          aria-label="Policy navigation"
        >
          {/* Enhanced header with better typography */}
          <header className="px-6 py-6 lg:py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Policies
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Browse our policies and guidelines
            </p>
          </header>

          {/* Enhanced scrollable content area */}
          <nav
            className="flex-grow overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            role="menu"
          >
            <ul className="space-y-2" role="menuitem">
              {data.map((item, idx) => (
                <li key={item.id ?? idx} role="none">
                  <button
                    type="button"
                    onClick={() => handleNavigate && handleNavigate(item.id)}
                    className={`
                      w-full py-3 px-4 rounded-xl text-left text-base font-medium
                      transition-all duration-200 select-none group
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      dark:focus:ring-offset-gray-900
                      ${
                        page?.toString() === item.id.toString()
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:text-blue-700 dark:hover:text-blue-300"
                      }
                    `}
                    aria-current={
                      page?.toString() === item.id.toString()
                        ? "page"
                        : undefined
                    }
                    role="button"
                  >
                    <span className="flex items-center justify-between">
                      <span className="truncate">{item.title}</span>
                      {page?.toString() === item.id.toString() && (
                        <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Enhanced admin section */}
          {user?.role === "ADMIN" && (
            <footer className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <Button
                onPress={() =>
                  setopenmodal((prev) => ({ ...prev, addpolicy: true }))
                }
                type="button"
                style={{ width: "100%" }}
                size="lg"
                className="flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                startContent={
                  <span className="text-xl font-bold bg-white text-green-600 w-6 h-6 rounded-full flex items-center justify-center">
                    +
                  </span>
                }
                aria-label="Add new policy"
              >
                Add New Policy
              </Button>
            </footer>
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
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.25, delay: 0.1 },
    },
  },
  closed: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.2 },
    },
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

    const toggleAccordion = useCallback(() => {
      setopen(!open);
    }, [open]);

    // Generate structured data for SEO
    const structuredData = useMemo(() => {
      return {
        "@type": "Question",
        name: data.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: data.answer,
        },
      };
    }, [data.question, data.answer]);

    return (
      <>
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        <motion.article
          variants={questioncardAnimation}
          initial="closed"
          animate={open ? "open" : "closed"}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
          itemScope
          itemType="https://schema.org/Question"
        >
          {/* Question Header */}
          <header className="w-full">
            <button
              type="button"
              onClick={toggleAccordion}
              className="w-full p-4 lg:p-6 flex flex-row justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              aria-controls={`answer-${idx}`}
              id={`question-${idx}`}
            >
              <h3
                className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-left leading-relaxed pr-4"
                itemProp="name"
              >
                {data.question}
              </h3>

              <div
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                aria-hidden="true"
              >
                <motion.div
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabArrow width="24" height="24" type="down" />
                </motion.div>
              </div>
            </button>
          </header>

          {/* Answer Content */}
          <AnimatePresence>
            {open && (
              <motion.section
                id={`answer-${idx}`}
                role="region"
                aria-labelledby={`question-${idx}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                  opacity: { duration: 0.25 },
                }}
                className="border-t border-gray-100 dark:border-gray-700"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <div className="p-4 lg:p-6">
                  <div
                    className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none"
                    itemProp="text"
                    dangerouslySetInnerHTML={{
                      __html: data.answer,
                    }}
                  />
                </div>

                {/* Admin Controls */}
                {isAdmin && isEdit && (
                  <footer className="px-4 lg:px-6 pb-4 lg:pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="flex flex-row items-center gap-3">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() =>
                          setopenmodal((prev) => ({
                            ...prev,
                            [openstate]: true,
                          }))
                        }
                        className="font-medium"
                        startContent={<span className="text-sm">✏️</span>}
                        aria-label={`Edit question: ${data.question}`}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={handleConfirmDelete}
                        className="font-medium"
                        startContent={<span className="text-sm">🗑️</span>}
                        aria-label={`Delete question: ${data.question}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </footer>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </motion.article>

        {openmodal[openstate] && (
          <AddPolicyModal qa={[data]} edit={true} openstate={openstate} />
        )}
      </>
    );
  }
);
QuestionCard.displayName = "QuestionCard";
