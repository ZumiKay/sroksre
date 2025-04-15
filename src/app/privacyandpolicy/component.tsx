"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import PrimaryButton, { Selection } from "../component/Button";
import { SecondaryModal } from "../component/Modals";
import { TextField } from "@mui/material";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import {
  AddPolicyOrQuestion,
  Addpolicytype,
  Addquestiontype,
  DeleteQP,
} from "./action";
import { errorToast, successToast } from "../component/Loading";
import { TabArrow } from "../component/Asset";
import { Button, Chip } from "@heroui/react";
import { ApiRequest, useClickOutside } from "@/src/context/CustomHook";
import { Showtypemodal } from "./secondcomponent";
import Textarea from "@mui/joy/Textarea";
import { SecondaryConfirmModal } from "../component/Modals/Alert_Modal";
import MenuIcon from "@mui/icons-material/Menu";
import CancelIcon from "@mui/icons-material/Cancel";

interface sidebarContentType {
  id: number;
  content: string;
}

export const PolicyButton = ({
  title,
  color,
  policydata,
  ty,
  pid,
  showtype,
}: {
  title: string;
  ty: "edit" | "delete" | "showtype";
  color: string;
  policydata?: Addpolicytype;
  pid?: number;
  showtype?: string[];
}) => {
  const router = useRouter();

  const { openmodal, setopenmodal } = useGlobalContext();
  //Delete policy
  const handleDelete = useCallback(async () => {
    const makereq = DeleteQP.bind(null, { pid });

    const delreq = await makereq();

    if (delreq.success) {
      successToast(delreq.message as string);
      router.push("/privacyandpolicy");
    } else {
      errorToast(delreq.message as string);
    }
  }, [pid, router]);
  const handleEdit = useCallback(() => {
    if (ty === "edit") setopenmodal({ policymodal: true });

    if (ty === "delete")
      setopenmodal({
        confirmmodal: {
          open: true,
          onAsyncDelete: handleDelete,
        },
      });

    if (ty === "showtype") setopenmodal({ policyshowtype: true });
  }, [handleDelete, setopenmodal, ty]);

  return (
    <>
      <PrimaryButton
        type="button"
        text={title}
        radius="10px"
        color={color}
        onClick={handleEdit}
      />
      {openmodal["addpolicy"] && ty === "edit" && (
        <AddPolicyModal plc={policydata} edit={true} />
      )}
      {/*  */}
      {openmodal.policyshowtype && ty === "showtype" && pid && (
        <Showtypemodal id={pid ?? 0} value={new Set(showtype ?? [""])} />
      )}
      {openmodal.confirmmodal?.open && ty === "delete" && (
        <SecondaryConfirmModal />
      )}
    </>
  );
};

export const SidePolicyBar = memo(
  ({ isAdmin, data }: { isAdmin?: boolean; data: sidebarContentType[] }) => {
    const { openmodal, setopenmodal } = useGlobalContext();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const searchparams = useSearchParams();
    const ref = useClickOutside(() => setIsOpen(false));

    // Close sidebar when window resizes to larger viewports
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth > 1024) {
          setIsOpen(false);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleClick = (link: number) => {
      const params = new URLSearchParams(searchparams);
      params.set("p", link.toString());
      router.push(`?${params}`);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    const toggleSidebar = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    };

    // Sidebar variants for animations
    const sidebarVariants = {
      open: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
      closed: {
        x: "-100%",
        opacity: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
    };

    // Overlay variants
    const overlayVariants = {
      open: { opacity: 1, display: "block" },
      closed: { opacity: 0, transitionEnd: { display: "none" } },
    };

    return (
      <>
        {/* Hamburger button - visible on all screen sizes */}
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 lg:hidden bg-white shadow-md rounded-full w-12 h-12 flex items-center justify-center"
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? (
            <MenuIcon fontSize="medium" />
          ) : (
            <CancelIcon fontSize="medium" />
          )}
        </button>

        {/* Overlay - only visible on mobile when sidebar is open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          <motion.aside
            ref={ref}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={sidebarVariants}
            className={`
              fixed top-0 left-0 z-50 
              h-full w-[280px] bg-white shadow-xl
              flex flex-col p-6 pt-20
              transform transition-transform duration-300 ease-in-out
              lg:translate-x-0 lg:static lg:h-auto lg:shadow-md lg:rounded-lg lg:pt-6 lg:z-auto
            `}
          >
            <div className="flex flex-col space-y-4 overflow-y-auto flex-grow">
              {data.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleClick(item.id)}
                  className={`
                    py-2 px-3 rounded-md text-base font-medium
                    transition-colors duration-200
                    hover:bg-gray-100 cursor-pointer
                    ${
                      searchparams.get("p") === item.id.toString()
                        ? "bg-gray-100 font-semibold"
                        : ""
                    }
                  `}
                >
                  {item.content}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <PrimaryButton
                  text="Add New Policy"
                  height="40px"
                  onClick={() =>
                    setopenmodal((prev) => ({ ...prev, addpolicy: true }))
                  }
                  type="button"
                  radius="8px"
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </motion.aside>
        </AnimatePresence>

        {openmodal.addpolicy && <AddPolicyModal />}
      </>
    );
  }
);

SidePolicyBar.displayName = "SidePolicyBar";
export interface Policydata {
  qa?: Array<Addquestiontype>;
  plc?: Addpolicytype;
  edit?: boolean;
  openstate?: string;
}

type Typeofpolicy = "policy" | "question" | "paragraph";

const deleteRequest = async (qid?: number, pid?: number, ppid?: number) => {
  const deleteReq = DeleteQP.bind(null, { pid, qid, ppid });

  const makeReq = await deleteReq();

  if (makeReq.success) {
    successToast(makeReq.message as string);
  } else {
    errorToast(makeReq.message as string);
  }
};

export const AddPolicyModal = ({ qa, plc, edit, openstate }: Policydata) => {
  const router = useRouter();
  const { openmodal, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState({ post: false, delete: false });
  const [isEdit, setisEdit] = useState<{ [key: string]: boolean }>({});
  const [state, setstate] = useState<Addpolicytype>({
    title: "",
    Paragraph: [{ content: "" }],
  });
  const [question, setquestion] = useState<Array<Addquestiontype> | undefined>(
    undefined
  );
  const [type, settype] = useState<"Policy" | "Question">("Policy");

  useEffect(() => {
    if (plc) {
      setstate(plc);
      settype("Policy");
    } else if (qa) {
      setquestion(qa);
      settype("Question");
    }
  }, []);

  const AddMoreParagraph = useCallback(() => {
    const updateparagraph = [...state.Paragraph];

    updateparagraph.push({ content: "" });

    setisEdit({ [`input${updateparagraph.length - 1}`]: true });

    setstate((prev) => ({ ...prev, Paragraph: updateparagraph }));
  }, [state.Paragraph]);

  const handleParagraphChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement> | string, idx: number) => {
      const updateparagraph = [...state.Paragraph];

      if (typeof e !== "string") {
        const { value } = e.target;

        updateparagraph[idx].content = value;
      } else {
        updateparagraph[idx].title = e;
      }
      setstate((prev) => ({ ...prev, Paragraph: updateparagraph }));
    },
    [state.Paragraph]
  );
  const handleDelete = useCallback(
    async (idx: number, id?: number, deltype?: Typeofpolicy) => {
      const updatestate =
        type === "Policy"
          ? [...state.Paragraph]
          : question
          ? [...question]
          : [];
      updatestate.splice(idx, 1);
      if (deltype && id) {
        setloading((prev) => ({ ...prev, delete: false }));
        const ids = {
          qid: deltype === "question" ? id : undefined,
          pid: deltype === "policy" ? id : undefined,
          ppid: deltype === "paragraph" ? id : undefined,
        };

        await deleteRequest(ids.qid, ids.pid, ids.ppid);
        setloading((prev) => ({ ...prev, delete: true }));
      }
      if (type === "Policy") {
        setstate((prev) => ({ ...prev, Paragraph: updatestate } as never));
      } else {
        setquestion(updatestate as never);
      }
    },
    [question, state.Paragraph, type]
  );

  //Question handler
  const handleAddQuestion = useCallback(() => {
    const updatequestion = question ? [...question] : [];

    updatequestion.push({ question: "", answer: "" });

    setquestion(updatequestion);
  }, [question]);

  const handleChangeQuestion = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, idx: number) => {
      const { value, name } = e.target;

      const updatequestion = question ? [...question] : [];

      updatequestion[idx][name] = value;

      setquestion(updatequestion);
    },
    [question]
  );

  const handleSubmit = useCallback(async () => {
    setloading((prev) => ({ ...prev, post: true }));

    const makereq = AddPolicyOrQuestion.bind(null, {
      question: question,
      policy: state,
    });

    const createReq = !edit
      ? await makereq()
      : await ApiRequest({
          url: "/api/policy",
          method: "PUT",
          data: {
            type: type.toLowerCase(),
            question: question && question[0],
            policy: state,
          },
        });
    if (createReq.success) {
      successToast(createReq.message as string);
    } else {
      errorToast(createReq.message as string);
      return;
    }
    setloading((prev) => ({ ...prev, post: false }));
    setstate({ title: "", Paragraph: [{ content: "" }] });
    setquestion([{ question: "", answer: "" }]);
    if (openstate) setopenmodal((prev) => ({ ...prev, [openstate]: false }));
    router.refresh();
  }, [edit, openstate, question, router, setopenmodal, state, type]);
  return (
    <SecondaryModal
      open={
        (openstate ? openmodal[openstate] : openmodal["addpolicy"]) as boolean
      }
      size="4xl"
      placement="top"
      footer={() => {
        return (
          <div className="w-full h-[40px] flex flex-row gap-x-5">
            <PrimaryButton
              width="100%"
              type="button"
              onClick={() => handleSubmit()}
              text={edit ? "Update" : "Create"}
              disable={!state && !question}
              status={loading.post ? "loading" : "authenticated"}
              radius="10px"
            />
            <PrimaryButton
              width="100%"
              type="button"
              onClick={() => {
                setopenmodal((prev) => ({
                  ...prev,
                  [openstate ?? "addpolicy"]: false,
                }));
              }}
              text="Cancel"
              radius="10px"
              color="lightcoral"
            />
          </div>
        );
      }}
    >
      <form className="w-full h-fit max-small_phone:max-h-[50vh] overflow-x-hidden max-small_phone:h-full bg-white rounded-lg flex flex-col items-center gap-y-5 p-5">
        <Selection
          data={["Policy", "Question"]}
          value={type}
          onChange={(e) => settype(e.target.value as typeof type)}
          label="Type"
          disable={edit}
        />

        {type === "Policy" ? (
          <>
            <TextField
              type="text"
              label="Section title"
              value={state.title}
              onChange={(e) =>
                setstate((prev) => ({ ...prev, title: e.target.value }))
              }
              fullWidth
              required
            />
            <div className="w-full h-fit  pt-5">
              {state.Paragraph.map((par, idx) => (
                <div
                  key={idx}
                  className="w-full h-fit  flex flex-col gap-5 relative mt-2"
                >
                  <div className="w-full h-fit flex flex-row items-center gap-3">
                    <Chip
                      className={`text-white bg-sky-800`}
                      onClick={() =>
                        setisEdit((prev) => ({
                          ...prev,
                          [`input${idx}`]: isEdit[`input${idx}`]
                            ? !isEdit[`input${idx}`]
                            : true,
                        }))
                      }
                    >
                      {isEdit[`input${idx}`] ? "Done" : "Edit"}
                    </Chip>
                    <i
                      onClick={() => handleDelete(idx, par.id, "paragraph")}
                      className={`fa-solid fa-trash relative transition duration-300 active:text-white`}
                    ></i>
                  </div>
                  <TextField
                    name={`sub${idx + 1}`}
                    fullWidth
                    type="text"
                    label={`Sub Title #${idx + 1}`}
                    value={par.title}
                    onChange={({ target }) =>
                      handleParagraphChange(target.value as string, idx)
                    }
                    disabled={!isEdit[`input${idx}`]}
                  />
                  <Textarea
                    key={idx}
                    minRows={5}
                    value={state.Paragraph[idx].content}
                    onChange={(e) => handleParagraphChange(e, idx)}
                    variant="outlined"
                    placeholder="Paragraph"
                    disabled={!isEdit[`input${idx}`]}
                    required
                  />
                </div>
              ))}
              <Button
                onPress={() => AddMoreParagraph()}
                type="button"
                variant="bordered"
                color="primary"
              >
                Add New
              </Button>
            </div>
          </>
        ) : (
          <div className="question w-full h-fit flex flex-col gap-y-5">
            {question?.map((_, idx) => (
              <div key={idx} className="w-full h-fit flex flex-col gap-y-5">
                <label className="text-lg font-bold">
                  {" "}
                  {`Question ${idx + 1}`}{" "}
                </label>
                <TextField
                  type="text"
                  name={`question`}
                  label="Question"
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  value={question[idx].question}
                  fullWidth
                  required
                />
                <TextField
                  type="text"
                  name={`answer`}
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  label="Answer"
                  value={question[idx].answer}
                  fullWidth
                  required
                />
                <i
                  onClick={() => handleDelete(idx)}
                  className={`fa-solid fa-trash relative transition duration-300 active:text-white left-[90%]`}
                ></i>
              </div>
            ))}
            {!edit && (
              <PrimaryButton
                text="New Question"
                onClick={handleAddQuestion}
                radius="10px"
                height="40px"
                type="button"
              />
            )}
          </div>
        )}
      </form>
    </SecondaryModal>
  );
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

    const handleDelete = useCallback(async () => {
      const makereq = DeleteQP.bind(null, { qid: data.id });
      const delreq = await makereq();
      if (delreq.success) {
        successToast(delreq.message as string);
      } else {
        errorToast(delreq.message as string);
      }
    }, [data.id]);

    const handleConfirmDelete = () => {
      setopenmodal({
        confirmmodal: { open: true, onAsyncDelete: handleDelete },
      });
    };

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
