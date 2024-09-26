"use client";
import Textarea from "@mui/joy/Textarea";
import { TextField } from "@mui/material";
import { SecondaryModal } from "../component/Modals";
import { Paragraph } from "@prisma/client";
import React, { ChangeEvent } from "react";
import { Addpolicytype, Addquestiontype } from "./action";
import PrimaryButton from "../component/Button";

export const ParagraphModal = ({
  open,
  setopen,
  par,
  idx,
  onChange,
  state,
  handleAddParagraph,
  paragraph,
  setparagraph,
  type,
  handleChangeQuestion,
  question,
  setquestion,
  handleAddQuestion,
}: {
  idx: number;
  par?: Paragraph;
  open: boolean;
  state?: Addpolicytype;
  setopen: (val: boolean) => void;
  onChange?: (
    value: ChangeEvent<HTMLTextAreaElement> | string,
    idx: number
  ) => void;
  handleAddParagraph?: () => void;
  handleChangeQuestion?: (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    idx: number
  ) => void;
  paragraph?: Paragraph;
  setparagraph?: React.Dispatch<React.SetStateAction<Paragraph>>;
  question?: Addquestiontype;
  setquestion?: React.Dispatch<React.SetStateAction<Addquestiontype>>;
  type: "Question" | "Policy";
  handleAddQuestion?: () => void;
}) => {
  return (
    <SecondaryModal
      size="3xl"
      placement="center"
      open={open}
      onPageChange={(val) => setopen(val)}
      closebtn
      footer={() => {
        return (
          <>
            <PrimaryButton
              onClick={() =>
                handleAddParagraph
                  ? handleAddParagraph()
                  : handleAddQuestion && handleAddQuestion()
              }
              type="button"
              text="Add"
              width="100%"
              height="40px"
            />
          </>
        );
      }}
    >
      {type === "Policy" ? (
        <>
          {" "}
          <TextField
            name={`sub${idx + 1}`}
            fullWidth
            type="text"
            label={`Sub Title #${idx + 1}`}
            value={paragraph ? paragraph.title : par && par.title}
            onChange={({ target }) =>
              setparagraph
                ? setparagraph((prev) => ({ ...prev, title: target.value }))
                : onChange && onChange(target.value as string, idx)
            }
          />
          <Textarea
            key={idx}
            minRows={5}
            value={
              paragraph
                ? paragraph.content
                : state && state.Paragraph[idx].content
            }
            onChange={(e) =>
              setparagraph
                ? setparagraph((prev) => ({ ...prev, content: e.target.value }))
                : onChange && onChange(e, idx)
            }
            variant="outlined"
            placeholder="Paragraph"
            required
          />{" "}
        </>
      ) : (
        handleChangeQuestion &&
        question && (
          <>
            <TextField
              type="text"
              name={`question`}
              label="Question"
              onChange={(e) =>
                setquestion &&
                setquestion((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
              value={question.question}
              fullWidth
              required
            />
            <TextField
              type="text"
              name={`answer`}
              onChange={(e) =>
                setquestion &&
                setquestion((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
              label="Answer"
              value={question.question}
              fullWidth
              required
            />
          </>
        )
      )}
    </SecondaryModal>
  );
};
