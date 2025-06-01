"use client";
import {
  AddPolicyOrQuestion,
  Addpolicytype,
  Addquestiontype,
  ParagraphType,
} from "../../privacyandpolicy/action";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { SelectType, Typeofpolicy } from "@/src/context/GlobalType.type";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import PrimaryButton from "../Button";
import { AsyncSelection } from "../AsynSelection";
import { TextField } from "@mui/material";
import { Button, Chip, Form, Textarea } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

interface Policydata {
  qa?: Array<Addquestiontype>;
  plc?: Addpolicytype;
  edit?: boolean;
  openstate?: string;
}

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

const PolictTypeData: Array<SelectType> = [
  { label: "Policy", value: "policy" },
  { label: "Question", value: "question" },
];

const ParagraphItem = memo(
  ({
    paragraph,
    index,
    isEditable,
    onTitleChange,
    onContentChange,
    onToggleEdit,
    onDelete,
  }: {
    paragraph: ParagraphType;
    index: number;
    isEditable: boolean;
    onTitleChange: (value: string, idx: number) => void;
    onContentChange: (e: string, idx: number) => void;
    onToggleEdit: (idx: number) => void;
    onDelete: (idx: number, id?: number, type?: Typeofpolicy) => void;
  }) => {
    // Initialize with paragraph.content
    const [content, setContent] = useState<string>(paragraph.content || "");
    const [title, setitle] = useState(paragraph.title || "");

    // Update local state when paragraph.content changes from parent
    useEffect(() => {
      setContent(paragraph.content || "");
    }, [paragraph.content]);

    const handleChangeContent = useCallback(
      (val: string) => {
        setContent(val || "");

        onContentChange(val || "", index);
      },
      [index, onContentChange]
    );

    const handleTitleChange = useCallback(
      (val: string) => {
        setitle(val || "");
        onTitleChange(val || "", index);
      },
      [index, onTitleChange]
    );

    return (
      <div className="w-full h-fit flex flex-col gap-5 relative mt-2">
        <div className="w-full h-fit flex flex-row items-center gap-3">
          <Chip
            className={`text-white bg-sky-800`}
            onClick={() => onToggleEdit(index)}
          >
            {isEditable ? "Done" : "Edit"}
          </Chip>

          <FontAwesomeIcon
            icon={faTrash}
            onClick={() => onDelete(index, paragraph.id, "paragraph")}
            className="relative transition duration-300 active:text-white"
          />
        </div>
        <TextField
          name={`sub${index + 1}`}
          fullWidth
          type="text"
          label={`Sub Title #${index + 1}`}
          value={paragraph.title || title}
          onChange={(e) => handleTitleChange(e.target.value)}
          disabled={!isEditable}
        />
        <Textarea
          minRows={5}
          className="w-full p-2  rounded min-h-[100px]"
          value={content}
          placeholder="Paragraph"
          variant="bordered"
          onValueChange={(e) => handleChangeContent(e)}
          disabled={!isEditable}
          required
        />
      </div>
    );
  }
);
ParagraphItem.displayName = "ParagraphItem";

// Memoized question component
const QuestionItem = memo(
  ({
    question,
    index,
    onChange,
    onDelete,
  }: {
    question: Addquestiontype;
    index: number;
    onChange: (
      e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
      idx: number
    ) => void;
    onDelete: (idx: number) => void;
  }) => {
    return (
      <div className="w-full h-fit flex flex-col gap-y-5">
        <label className="text-lg font-bold">{`Question ${index + 1}`}</label>
        <TextField
          type="text"
          name="question"
          label="Question"
          onChange={(e) => onChange(e, index)}
          value={question.question}
          fullWidth
          required
        />
        <TextField
          type="text"
          name="answer"
          onChange={(e) => onChange(e, index)}
          label="Answer"
          value={question.answer}
          fullWidth
          required
        />
        <i
          onClick={() => onDelete(index)}
          className="fa-solid fa-trash relative transition duration-300 active:text-white left-[90%]"
        ></i>
      </div>
    );
  }
);
QuestionItem.displayName = "QuestionItem";

export const AddPolicyModal = ({ qa, plc, edit, openstate }: Policydata) => {
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
  const [type, settype] = useState<Typeofpolicy>("policy");

  // Initialize data from props
  useEffect(() => {
    if (plc) {
      setstate(plc);
      settype("policy");
    } else if (qa) {
      setquestion(qa);
      settype("question");
    }
  }, [plc, qa]);

  // Memoized modal open state
  const isModalOpen = useMemo(() => {
    return (
      openstate ? openmodal[openstate] : openmodal["addpolicy"]
    ) as boolean;
  }, [openmodal, openstate]);

  // Type selection handler
  const handleSelectType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      settype(e.target.value as Typeofpolicy);
    },
    []
  );

  // Policy title change handler
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setstate((prev) => ({ ...prev, title: e.target.value }));
    },
    []
  );

  // Toggle edit state for a paragraph
  const toggleEditState = useCallback((idx: number) => {
    setisEdit((prev) => ({
      ...prev,
      [`input${idx}`]: prev[`input${idx}`] ? !prev[`input${idx}`] : true,
    }));
  }, []);

  // Add paragraph handler
  const AddMoreParagraph = useCallback(() => {
    setstate((prev) => {
      const updateParagraph = [...prev.Paragraph, { content: "" }];

      // Set edit mode for the new paragraph
      setisEdit((prevEdit) => ({
        ...prevEdit,
        [`input${updateParagraph.length - 1}`]: true,
      }));

      return { ...prev, Paragraph: updateParagraph };
    });
  }, []);

  // Optimize paragraph content change handler
  const handleParagraphChange = useCallback((e: string, idx: number) => {
    setstate((prev) => {
      const updatedParagraphs = [...prev.Paragraph];
      updatedParagraphs[idx].content = e;
      return { ...prev, Paragraph: updatedParagraphs };
    });
  }, []);

  // Optimize paragraph title change handler
  const handleParagraphTitleChange = useCallback(
    (value: string, idx: number) => {
      setstate((prev) => {
        const updatedParagraphs = [...prev.Paragraph];
        updatedParagraphs[idx].title = value;
        return { ...prev, Paragraph: updatedParagraphs };
      });
    },
    []
  );

  // Delete handler (optimized to handle both paragraph and question deletion)
  const handleDelete = useCallback(
    async (idx: number, id?: number, deltype?: Typeofpolicy) => {
      // Handle API deletion if necessary
      if (deltype && id) {
        setloading((prev) => ({ ...prev, delete: true }));
        await deleteRequest(id, deltype);
        setloading((prev) => ({ ...prev, delete: false }));
      }

      // Update local state
      if (type === "policy") {
        setstate((prev) => {
          const updatedParagraphs = [...prev.Paragraph];
          updatedParagraphs.splice(idx, 1);
          return { ...prev, Paragraph: updatedParagraphs };
        });
      } else if (question) {
        setquestion((prev) => {
          if (!prev) return undefined;
          const updatedQuestions = [...prev];
          updatedQuestions.splice(idx, 1);
          return updatedQuestions;
        });
      }
    },
    [question, type]
  );

  // Add question handler
  const handleAddQuestion = useCallback(() => {
    setquestion((prev) => {
      const updatedQuestions = prev ? [...prev] : [];
      updatedQuestions.push({ question: "", answer: "" });
      return updatedQuestions;
    });
  }, []);

  // Question change handler
  const handleChangeQuestion = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
      idx: number
    ) => {
      const { value, name } = e.target;

      setquestion((prev) => {
        if (!prev) return undefined;

        const updatedQuestions = [...prev];
        updatedQuestions[idx] = {
          ...updatedQuestions[idx],
          [name]: value,
        };

        return updatedQuestions;
      });
    },
    []
  );

  // Submission handler
  const handleSubmit = useCallback(async () => {
    setloading((prev) => ({ ...prev, post: true }));

    try {
      let response;

      if (!edit) {
        response = await AddPolicyOrQuestion({
          question: question,
          policy: state,
        });
      } else {
        response = await ApiRequest({
          url: "/api/policy",
          method: "PUT",
          data: {
            ty: "detail",
            type: type.toLowerCase(),
            question: question && question[0],
            policy: state,
          },
        });
      }

      if (response.success) {
        successToast(response.message as string);

        // Reset form state after successful submission
        setstate({ title: "", Paragraph: [{ content: "" }] });
        setquestion([{ question: "", answer: "" }]);

        // Close modal if needed
        if (openstate) {
          setopenmodal((prev) => ({ ...prev, [openstate]: false }));
        }
      } else {
        errorToast(response.message as string);
      }
    } catch (error) {
      errorToast("An error occurred during submission");
      console.error("Submit error:", error);
    } finally {
      setloading((prev) => ({ ...prev, post: false }));
    }
  }, [edit, openstate, question, setopenmodal, state, type]);

  // Close modal handler
  const handleCloseModal = useCallback(() => {
    setopenmodal((prev) => ({
      ...prev,
      [openstate ?? "addpolicy"]: false,
    }));
  }, [setopenmodal, openstate]);

  // Check if submit should be disabled
  const isSubmitDisabled = useMemo(() => {
    if (type === "policy") {
      return (
        !state.title ||
        state.Paragraph.length === 0 ||
        state.Paragraph.some((p) => !p.content || p.content.length === 0)
      );
    } else {
      return (
        !question ||
        question.length === 0 ||
        question.some(
          (q) =>
            !q.question ||
            !q.answer ||
            q.question.length === 0 ||
            q.answer.length === 0
        )
      );
    }
  }, [state, question, type]);

  // Memoized footer component
  const modalFooter = useCallback(() => {
    return (
      <div className="w-full h-[40px] flex flex-row gap-x-5">
        <PrimaryButton
          width="100%"
          type="button"
          onClick={handleSubmit}
          text={edit ? "Update" : "Create"}
          disable={isSubmitDisabled}
          status={loading.post ? "loading" : "authenticated"}
          radius="10px"
        />
        <PrimaryButton
          width="100%"
          type="button"
          onClick={handleCloseModal}
          text="Cancel"
          radius="10px"
          color="lightcoral"
        />
      </div>
    );
  }, [edit, handleSubmit, handleCloseModal, isSubmitDisabled, loading.post]);

  return (
    <SecondaryModal
      open={isModalOpen}
      size="4xl"
      placement="top"
      onPageChange={() => setopenmodal({})}
      footer={modalFooter}
    >
      <Form className="w-full h-fit max-small_phone:max-h-[50vh] overflow-x-hidden max-small_phone:h-full bg-white rounded-lg flex flex-col items-center gap-y-5 p-5">
        <AsyncSelection
          type="normal"
          data={() => PolictTypeData}
          option={{
            label: "Type",
            placeholder: "Select",
            selectedValue: [type],
            onValueChange: handleSelectType,
          }}
        />

        {type === "policy" ? (
          <>
            <TextField
              type="text"
              label="Section title"
              value={state.title}
              onChange={handleTitleChange}
              fullWidth
              required
            />
            <div className="w-full h-fit pt-5">
              {state.Paragraph.map((paragraph, idx) => (
                <ParagraphItem
                  key={`paragraph-${idx}`}
                  paragraph={paragraph}
                  index={idx}
                  isEditable={!!isEdit[`input${idx}`]}
                  onTitleChange={handleParagraphTitleChange}
                  onContentChange={handleParagraphChange}
                  onToggleEdit={toggleEditState}
                  onDelete={handleDelete}
                />
              ))}
              <Button
                onPress={AddMoreParagraph}
                type="button"
                variant="bordered"
                color="primary"
                className="mt-2"
              >
                Add New
              </Button>
            </div>
          </>
        ) : (
          <div className="question w-full h-fit flex flex-col gap-y-5">
            {question?.map((q, idx) => (
              <QuestionItem
                key={`question-${idx}`}
                question={q}
                index={idx}
                onChange={handleChangeQuestion}
                onDelete={handleDelete}
              />
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
      </Form>
    </SecondaryModal>
  );
};
