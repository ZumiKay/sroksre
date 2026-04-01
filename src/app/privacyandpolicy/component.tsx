"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import PrimaryButton, { Selection } from "../component/Button";
import { SecondaryModal } from "../component/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "@mui/material";

import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, SubmitEvent, useEffect, useState } from "react";
import {
  AddPolicyOrQuestion,
  Addpolicytype,
  Addquestiontype,
  DeleteQP,
} from "./action";
import { errorToast, successToast } from "../component/Loading";
import { PrimaryConfirmModal } from "../component/SideMenu";
import { Button, Chip } from "@heroui/react";
import { ApiRequest, useClickOutside } from "@/src/context/CustomHook";
import { Showtypemodal } from "./secondcomponent";
import Textarea from "@mui/joy/Textarea";

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
  const [loading, setloading] = useState(false);
  const router = useRouter();
  let openstate = "editpolicy";
  const { openmodal, setopenmodal } = useGlobalContext();
  const handleEdit = () => {
    if (ty === "edit") setopenmodal((prev) => ({ ...prev, [openstate]: true }));

    if (ty === "delete")
      setopenmodal((prev) => ({ ...prev, primaryconfirm: true }));

    if (ty === "showtype")
      setopenmodal((prev) => ({ ...prev, showtype: true }));
  };

  //Delete policy
  const handleDelete = async () => {
    setloading(true);
    const makereq = DeleteQP.bind(null, { pid });

    const delreq = await makereq();

    setloading(false);

    if (delreq.success) {
      successToast(delreq.message as string);
      router.push("/privacyandpolicy");
    } else {
      errorToast(delreq.message as string);
    }
  };
  return (
    <>
      <PrimaryButton
        type="button"
        text={title}
        radius="8px"
        color={color}
        onClick={handleEdit}
      />
      {openmodal[openstate] && ty === "edit" && (
        <AddPolicyModal plc={policydata} openstate={openstate} edit={true} />
      )}
      {openmodal.primaryconfirm && ty === "delete" && (
        <PrimaryConfirmModal
          actions={{
            yes: handleDelete,
            no: () =>
              setopenmodal((prev) => ({ ...prev, primaryconfirm: false })),
          }}
          loading={loading}
        />
      )}
      {openmodal.showtype && ty === "showtype" && pid && (
        <Showtypemodal id={pid ?? 0} value={new Set(showtype ?? [""])} />
      )}
    </>
  );
};

export const SidePolicyBar = ({
  isAdmin,
  data,
}: {
  isAdmin?: boolean;
  data: sidebarContentType[];
}) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [open, setopen] = useState(false);
  const router = useRouter();
  const searchparams = useSearchParams();
  const ref = useClickOutside(() => setopen(false));

  const activeId = searchparams.get("p");

  const handleClick = (link: number) => {
    const params = new URLSearchParams(searchparams);
    params.set("p", link.toString());
    router.push(`?${params}`);
    setopen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <div
        ref={ref}
        onClick={() => setopen(!open)}
        className="smallest_screen:hidden fixed top-20 right-3 z-50 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer select-none transition-colors hover:bg-gray-50"
      >
        {open ? "Close" : "Menu"}
      </div>

      {/* Sidebar */}
      <motion.aside
        ref={ref}
        style={open ? { display: "flex" } : {}}
        className="sidebar fixed bg-white border-r border-gray-100 left-0 top-0 w-62.5 h-screen pt-24 pb-6 px-3 flex-col items-start gap-y-1 shadow-sm
        max-smallest_screen:hidden max-smallest_screen:top-32.5 max-smallest_screen:left-[55%] max-smallest_screen:h-fit max-smallest_screen:rounded-xl max-smallest_screen:border max-smallest_screen:border-gray-200 max-smallest_screen:shadow-lg max-smallest_screen:p-3 max-small_phone:left-[35%] z-50"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-3 mb-2">
          Navigation
        </p>

        {data.map((i, idx) => {
          const isActive = activeId === i.id.toString();
          return (
            <div
              key={idx}
              onClick={() => handleClick(i.id)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {i.content}
            </div>
          );
        })}

        {isAdmin && (
          <div className="w-full mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={() =>
                setopenmodal((prev) => ({ ...prev, addpolicy: true }))
              }
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add New
            </button>
          </div>
        )}
      </motion.aside>

      {openmodal.addpolicy && <AddPolicyModal />}
    </>
  );
};

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
    undefined,
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

  const AddMoreParagraph = () => {
    const updateparagraph = [...state.Paragraph];
    updateparagraph.push({ content: "" });
    setisEdit({ [`input${updateparagraph.length - 1}`]: true });
    setstate((prev) => ({ ...prev, Paragraph: updateparagraph }));
  };

  const handleParagraphChange = (
    e: ChangeEvent<HTMLTextAreaElement> | string,
    idx: number,
  ) => {
    const updateparagraph = [...state.Paragraph];
    if (typeof e !== "string") {
      const { value } = e.target;
      updateparagraph[idx].content = value;
    } else {
      updateparagraph[idx].title = e;
    }
    setstate((prev) => ({ ...prev, Paragraph: updateparagraph }));
  };

  const handleDelete = async (
    idx: number,
    id?: number,
    deltype?: Typeofpolicy,
  ) => {
    const updatestate =
      type === "Policy" ? [...state.Paragraph] : question ? [...question] : [];
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
      setstate((prev) => ({ ...prev, Paragraph: updatestate }) as any);
    } else {
      setquestion(updatestate as any);
    }
  };

  const handleAddQuestion = () => {
    const updatequestion = question ? [...question] : [];
    updatequestion.push({ question: "", answer: "" });
    setquestion(updatequestion);
  };

  const handleChangeQuestion = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    idx: number,
  ) => {
    const { value, name } = e.target;
    const updatequestion = question ? [...question] : [];
    updatequestion[idx][name] = value;
    setquestion(updatequestion);
  };

  const handleSubmit = async () => {
    setloading((prev) => ({ ...prev, post: true }));

    const makereq = AddPolicyOrQuestion.bind(null, {
      question: question,
      policy: state,
    });

    const createReq = !edit
      ? await makereq()
      : await ApiRequest("/api/policy", undefined, "PUT", "JSON", {
          type: type.toLowerCase(),
          question: question && question[0],
          policy: state,
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
    openstate && setopenmodal((prev) => ({ ...prev, [openstate]: false }));
    router.refresh();
  };

  return (
    <SecondaryModal
      open={
        (openstate ? openmodal[openstate] : openmodal["addpolicy"]) as boolean
      }
      size="4xl"
      placement="top"
      header={() => (
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold text-gray-900">
            {edit ? "Edit" : "Add New"}{" "}
            {type === "Policy" ? "Policy" : "Question"}
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            {edit
              ? "Update the content below and save your changes."
              : "Fill in the fields below to create a new entry."}
          </p>
        </div>
      )}
      footer={() => (
        <div className="w-full flex flex-row gap-x-3">
          <Button
            fullWidth
            isLoading={loading.post}
            color="primary"
            variant="solid"
            onPress={() => handleSubmit()}
            className="font-semibold"
          >
            {edit ? "Save Changes" : "Create"}
          </Button>
          <Button
            fullWidth
            isDisabled={Object.entries(loading).some(([, val]) => val)}
            variant="flat"
            color="default"
            onPress={() => {
              setopenmodal((prev) => ({
                ...prev,
                [openstate ?? "addpolicy"]: false,
              }));
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    >
      <div className="w-full h-fit max-small_phone:max-h-[50vh] overflow-x-hidden max-small_phone:h-full flex flex-col gap-y-5">
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
              label="Section Title"
              value={state.title}
              onChange={(e) =>
                setstate((prev) => ({ ...prev, title: e.target.value }))
              }
              fullWidth
              required
            />

            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Paragraphs
                </p>
                <Button
                  onClick={AddMoreParagraph}
                  type="button"
                  variant="flat"
                  color="primary"
                  size="sm"
                  startContent={<FontAwesomeIcon icon={faPlus} className="text-xs" />}
                >
                  Add Paragraph
                </Button>
              </div>

              {state.Paragraph.map((par, idx) => {
                const editKey = `input${idx}`;
                const editing = !!isEdit[editKey];
                return (
                  <div
                    key={idx}
                    className={`w-full rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                      editing
                        ? "border-sky-300 bg-sky-50/40"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Paragraph {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setisEdit((prev) => ({
                              ...prev,
                              [editKey]: !prev[editKey],
                            }))
                          }
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            editing
                              ? "bg-sky-600 text-white"
                              : "bg-white text-gray-600 border border-gray-300 hover:border-sky-400"
                          }`}
                        >
                          {editing ? "Done" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(idx, par.id, "paragraph")
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </div>

                    <TextField
                      name={`sub${idx + 1}`}
                      fullWidth
                      type="text"
                      label={`Sub Title (optional)`}
                      value={par.title}
                      onChange={({ target }) =>
                        handleParagraphChange(target.value as string, idx)
                      }
                      disabled={!editing}
                      size="small"
                    />
                    <Textarea
                      minRows={4}
                      value={state.Paragraph[idx].content}
                      onChange={(e) => handleParagraphChange(e, idx)}
                      variant="outlined"
                      placeholder="Write paragraph content here..."
                      disabled={!editing}
                      required
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="question w-full flex flex-col gap-y-4">
            {question?.map((_, idx) => (
              <div
                key={idx}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Question {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
                <TextField
                  type="text"
                  name="question"
                  label="Question"
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  value={question[idx].question}
                  fullWidth
                  required
                  size="small"
                />
                <TextField
                  type="text"
                  name="answer"
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  label="Answer"
                  value={question[idx].answer}
                  fullWidth
                  required
                  size="small"
                  multiline
                  minRows={2}
                />
              </div>
            ))}
            {!edit && (
              <Button
                onClick={handleAddQuestion}
                type="button"
                variant="flat"
                color="primary"
                startContent={<FontAwesomeIcon icon={faPlus} className="text-xs" />}
              >
                Add Question
              </Button>
            )}
          </div>
        )}
      </div>
    </SecondaryModal>
  );
};

export const QuestionCard = ({
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
  let openstate = `policyQ${idx}`;
  const { openmodal, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [open, setopen] = useState(false);

  const handleDelete = async () => {
    setloading(true);
    const makereq = DeleteQP.bind(null, { qid: data.id });
    const delreq = await makereq();
    setloading(false);
    if (delreq.success) {
      successToast(delreq.message as string);
    } else {
      errorToast(delreq.message as string);
    }
    setopenmodal((prev) => ({
      ...prev,
      [`primarymodal${idx}`]: false,
    }));
  };

  return (
    <>
      <div
        className={`w-full px-5 py-4 flex flex-col gap-y-3 transition-colors duration-150 ${
          open ? "bg-sky-50/50" : "bg-white hover:bg-gray-50/60"
        }`}
      >
        <button
          type="button"
          className="w-full flex flex-row justify-between items-center text-left"
          onClick={() => setopen(!open)}
        >
          <span className="text-base font-medium text-gray-800 pr-4">
            {data.question}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
          </motion.span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-sky-300 pl-3">
                {data.answer}
              </p>

              {isAdmin && isEdit && (
                <div className="btn_con flex flex-row items-center gap-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() =>
                      setopenmodal((prev) => ({ ...prev, [openstate]: true }))
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={() =>
                      setopenmodal((prev) => ({
                        ...prev,
                        [`primarymodal${idx}`]: true,
                      }))
                    }
                  >
                    Delete
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {openmodal[openstate] && (
        <AddPolicyModal qa={[data]} edit={true} openstate={openstate} />
      )}
      {openmodal[`primarymodal${idx}`] && (
        <PrimaryConfirmModal
          actions={{
            no: () =>
              setopenmodal((prev) => ({
                ...prev,
                [`primarymodal${idx}`]: false,
              })),
            yes: handleDelete,
          }}
          loading={loading}
        />
      )}
    </>
  );
};
