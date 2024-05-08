"use client";

import { useSearchParams, useRouter } from "next/navigation";
import PrimaryButton, { Selection } from "../component/Button";
import Modal from "../component/Modals";
import { TextField } from "@mui/material";
import Textarea from "@mui/joy/Textarea";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, FormEvent, useState } from "react";
import { Addpolicytype, Addquestiontype } from "./action";

const sidebarcontent: Array<{ content: string; link: string }> = [
  {
    content: "Privacy policy",
    link: "/privacypolicy",
  },
  {
    content: "Returns and Refund",
    link: "/returnandrefund",
  },
];

export const PolicyButton = ({
  title,
  ty,
  color,
}: {
  title: string;
  ty: string;
  color: string;
}) => {
  const handleEdit = () => {};
  return (
    <PrimaryButton type="button" text={title} radius="10px" color={color} />
  );
};

export const SidePolicyBar = ({ isAdmin }: { isAdmin?: boolean }) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const router = useRouter();
  const searchparams = useSearchParams();

  const handleClick = (link: string) => {
    const params = new URLSearchParams(searchparams);

    params.set("p", link);

    router.push(`?${params}`);
  };
  return (
    <nav className="sidebar fixed left-0 w-[280px] h-fit p-3 flex flex-col items-start">
      {sidebarcontent.map((i, idx) => (
        <div
          key={idx}
          onClick={() => handleClick(i.link)}
          className="underline text-lg font-bold w-full h-fit transition-all hover:text-gray-300 cursor-pointer"
        >
          {i.content}
        </div>
      ))}

      {isAdmin && (
        <PrimaryButton
          text="Add Section"
          height="30px"
          style={{ marginTop: "50px" }}
          onClick={() => setopenmodal((prev) => ({ ...prev, addpolicy: true }))}
          type="button"
          radius="10px"
        />
      )}

      {openmodal?.addpolicy && <AddPolicyModal />}
    </nav>
  );
};

interface Policydata {
  qa?: Array<Addquestiontype>;
  plc?: Array<Addpolicytype>;
}

export const AddPolicyModal = ({ qa, plc }: Policydata) => {
  const { setopenmodal } = useGlobalContext();
  const [state, setstate] = useState<Addpolicytype>({
    title: "",
    paragraph: [""],
  });
  const [question, setquestion] = useState<Array<Addquestiontype> | undefined>(
    undefined
  );
  const [type, settype] = useState<"Policy" | "Question">("Policy");

  const AddMoreParagraph = () => {
    const updateparagraph = [...state.paragraph];

    updateparagraph.push("");

    setstate((prev) => ({ ...prev, paragraph: updateparagraph }));
  };

  const handleParagraphChange = (
    e: ChangeEvent<HTMLTextAreaElement>,
    idx: number
  ) => {
    const updateparagraph = [...state.paragraph];
    const { value } = e.target;

    updateparagraph[idx] = value;

    setstate((prev) => ({ ...prev, paragraph: updateparagraph }));
  };
  const handleDelete = (idx: number) => {
    const updatestate =
      type === "Policy" ? [...state.paragraph] : question ? [...question] : [];
    updatestate.splice(idx, 1);
    if (type === "Policy") {
      setstate((prev) => ({ ...prev, paragraph: updatestate } as any));
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
    e.preventDefault();
  };
  return (
    <Modal closestate="addpolicy" customZIndex={120}>
      <form
        onSubmit={handleSubmit}
        className="w-full h-screen bg-white rounded-lg flex flex-col items-center gap-y-5 p-5"
      >
        <Selection
          data={["Policy", "Question"]}
          value={type}
          onChange={(e) => settype(e.target.value as typeof type)}
          label="Type"
        />
        {type === "Policy" ? (
          <>
            <TextField
              type="text"
              label="Section title"
              onChange={(e) =>
                setstate((prev) => ({ ...prev, title: e.target.value }))
              }
              fullWidth
              required
            />
            {state.paragraph.map((_, idx) => (
              <div className="w-full h-fit">
                <Textarea
                  key={idx}
                  minRows={5}
                  value={state.paragraph[idx]}
                  onChange={(e) => handleParagraphChange(e, idx)}
                  variant="outlined"
                  placeholder="Paragraph"
                  required
                />
                <i
                  onClick={() => handleDelete(idx)}
                  className={`fa-solid fa-trash relative transition duration-300 active:text-white left-[97%]`}
                ></i>
              </div>
            ))}
            <PrimaryButton
              onClick={AddMoreParagraph}
              type="button"
              text="Add paragraph"
              radius="10px"
            />
          </>
        ) : (
          <div className="question w-full h-fit flex flex-col gap-y-5">
            {question?.map((_, idx) => (
              <>
                <label className="text-lg font-bold">
                  {" "}
                  {`Question ${idx + 1}`}{" "}
                </label>
                <TextField
                  type="text"
                  name={`question${idx}`}
                  label="Question"
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  fullWidth
                  required
                />
                <TextField
                  type="text"
                  name={`answer${idx}`}
                  onChange={(e) => handleChangeQuestion(e, idx)}
                  label="Answer"
                  fullWidth
                  required
                />
                <i
                  onClick={() => handleDelete(idx)}
                  className={`fa-solid fa-trash relative transition duration-300 active:text-white left-[97%]`}
                ></i>
              </>
            ))}
            <PrimaryButton
              text="New Question"
              onClick={handleAddQuestion}
              radius="10px"
              type="button"
            />
          </div>
        )}
        <div className="w-full h-[40px] flex flex-row gap-x-5">
          <PrimaryButton
            width="100%"
            type="submit"
            text="Create"
            radius="10px"
          />
          <PrimaryButton
            width="100%"
            type="button"
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, addpolicy: false }))
            }
            text="Cancel"
            radius="10px"
            color="lightcoral"
          />
        </div>
      </form>
    </Modal>
  );
};
