"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import PrimaryButton, { Selection } from "../component/Button";
import Modal from "../component/Modals";
import { TextField } from "@mui/material";
import Textarea from "@mui/joy/Textarea";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  AddPolicyOrQuestion,
  Addpolicytype,
  Addquestiontype,
  DeleteQP,
} from "./action";
import { errorToast, successToast } from "../component/Loading";
import { TabArrow } from "../component/Asset";
import { PrimaryConfirmModal } from "../component/SideMenu";
import { Button } from "@nextui-org/react";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { Showtypemodal } from "./secondcomponent";

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
        radius="10px"
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

  const handleClick = (link: number) => {
    const params = new URLSearchParams(searchparams);

    params.set("p", link.toString());

    router.push(`?${params}`);
  };
  return (
    <>
      <div
        onClick={() => setopen(!open)}
        className="w-fit h-fit text-xl z-50 bg-gray-100 rounded-lg p-2 cursor-pointer smallest_screen:hidden flex items-center justify-center fixed top-20 right-2 transition-colors duration-100 hover:bg-black active:bg-black"
      >
        {" "}
        {open ? "X" : "Menu"}{" "}
      </div>
      <motion.aside
        style={open ? { display: "block" } : {}}
        className="sidebar fixed bg-white  left-0 w-[250px] h-fit p-3 flex flex-col items-start gap-y-10 rounded-lg
      max-smallest_screen:hidden max-smallest_screen:top-[130px] max-smallest_screen:left-[60%] max-small_phone:left-[40%] z-50
      "
      >
        {data.map((i, idx) => (
          <div
            key={idx}
            onClick={() => handleClick(i.id)}
            className="underline text-lg font-medium w-full h-fit transition-all hover:text-gray-300 cursor-pointer"
          >
            {i.content}
          </div>
        ))}

        {isAdmin && (
          <PrimaryButton
            text="Add New"
            height="30px"
            style={{ marginTop: "50px" }}
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, addpolicy: true }))
            }
            type="button"
            radius="10px"
          />
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
  const { setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState({ post: false, delete: false });
  const { isTablet, isMobile } = useScreenSize();
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

  const AddMoreParagraph = () => {
    const updateparagraph = [...state.Paragraph];

    updateparagraph.push({ content: "" });

    setstate((prev) => ({ ...prev, Paragraph: updateparagraph }));
  };

  const handleParagraphChange = (
    e: ChangeEvent<HTMLTextAreaElement> | string,
    idx: number
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
    deltype?: Typeofpolicy
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
      setstate((prev) => ({ ...prev, Paragraph: updatestate } as any));
    } else {
      setquestion(updatestate as any);
    }
  };

  //Question handler
  const handleAddQuestion = () => {
    const updatequestion = question ? [...question] : [];

    updatequestion.push({ question: "", answer: "" });

    setquestion(updatequestion);
  };

  const handleChangeQuestion = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    idx: number
  ) => {
    const { value, name } = e.target;

    const updatequestion = question ? [...question] : [];

    updatequestion[idx][name] = value;

    setquestion(updatequestion);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    setloading((prev) => ({ ...prev, post: true }));
    e.preventDefault();

    const makereq = AddPolicyOrQuestion.bind(null, {
      question: question,
      policy: state,
    });

    const createReq = edit
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
    <Modal
      customwidth={isMobile ? "100vw" : isTablet ? "90vw" : ""}
      closestate={openstate ?? "addpolicy"}
      customZIndex={150}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full h-[80vh] max-small_phone:h-full bg-white rounded-lg flex flex-col items-center gap-y-5 p-5"
      >
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
            <div className="w-full h-fit max-h-[90%] overflow-y-auto overflow-x-hidden pt-5">
              {state.Paragraph.map((par, idx) => (
                <div key={idx} className="w-full h-fit  flex flex-col gap-5">
                  <TextField
                    name={`sub${idx + 1}`}
                    fullWidth
                    type="text"
                    label={`Sub Title #${idx + 1}`}
                    value={par.title}
                    onChange={({ target }) =>
                      handleParagraphChange(target.value as string, idx)
                    }
                  />
                  <Textarea
                    key={idx}
                    minRows={5}
                    value={state.Paragraph[idx].content}
                    onChange={(e) => handleParagraphChange(e, idx)}
                    variant="outlined"
                    placeholder="Paragraph"
                    required
                  />
                  <i
                    onClick={() => handleDelete(idx, par.id, "paragraph")}
                    className={`fa-solid fa-trash relative transition duration-300 active:text-white left-[90%] bottom-2`}
                  ></i>
                </div>
              ))}
            </div>

            <Button
              onClick={AddMoreParagraph}
              type="button"
              variant="bordered"
              color="primary"
            >
              Add New
            </Button>
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
                type="button"
              />
            )}
          </div>
        )}
        <div className="w-full h-[40px] flex flex-row gap-x-5">
          <PrimaryButton
            width="100%"
            type="submit"
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
            disable={Object.entries(loading).some(([key, val]) => val)}
            text="Cancel"
            radius="10px"
            color="lightcoral"
          />
        </div>
      </form>
    </Modal>
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
      <motion.div
        variants={questioncardAnimation}
        initial="closed"
        animate={open ? "open" : "closed"}
        className="questioncard w-full  p-3 border-t-2 border-gray-300 flex flex-col items-start gap-y-5"
      >
        <div className="w-full h-fit flex flex-row justify-between items-center">
          <label className="text-lg font-medium w-full">{data.question}</label>
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
              onClick={() =>
                setopenmodal((prev) => ({
                  ...prev,
                  [`primarymodal${idx}`]: true,
                }))
              }
              color="lightcoral"
            />
          </div>
        )}
      </motion.div>
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
