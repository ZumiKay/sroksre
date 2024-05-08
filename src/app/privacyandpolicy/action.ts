"use server";

import Prisma from "@/src/lib/prisma";

interface returntype {
  success: boolean;
  message?: string;
}

export interface Addpolicytype {
  id?: number;
  title: string;
  paragraph: string[];
}

export interface Addquestiontype {
  id?: number;
  question: string;
  answer: string;
  [x: string]: string | number | undefined;
}

export interface Addpolicyandquestiontype {
  question?: Array<Addquestiontype>;
  policy?: Addpolicytype;
}
export const AddPolicyOrQuestion = async (
  data: Addpolicyandquestiontype
): Promise<returntype> => {
  try {
    const { question, policy } = data;

    if (question) {
      await Prisma.question.createMany({
        data: question.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
      });
    } else if (policy) {
      await Prisma.policy.create({
        data: {
          title: policy.title,
          Paragraph: {
            createMany: {
              data: policy.paragraph.map((p) => ({ content: p })),
            },
          },
        },
      });
    } else {
      return { success: false, message: "Invalid request" };
    }

    return { success: true, message: "Created Successfully" };
  } catch (error) {
    console.log("Create Policy Error", error);
    return { success: false, message: "Error Occured" };
  }
};

interface updatepolicytype {
  id: number;
  title: string;
  paragraph: {
    id: number;
    content: string;
  };
}

export const updateQuestionOrPolicy = async (
  type: "question" | "policy",
  question?: Addquestiontype,
  policy?: updatepolicytype
): Promise<returntype> => {
  if (!type && !question && !policy) {
    return { success: false, message: "Invalid request" };
  }
  try {
    if (type === "question") {
      await Prisma.question.update({
        where: {
          id: question?.id,
        },
        data: {
          question: question?.question,
          answer: question?.answer,
        },
      });
    } else {
      await Prisma.policy.update({
        where: {
          id: policy?.id as number,
        },
        data: {
          title: policy?.title,
          Paragraph: {
            update: {
              where: { id: policy?.paragraph.id },
              data: {
                content: policy?.paragraph.content,
              },
            },
          },
        },
      });
    }

    return { success: true, message: "Update successfuly" };
  } catch (error) {
    console.log("Update Policy", error);
    return { success: false, message: "Error occured" };
  }
};

interface deletepolicytype {
  pid?: number;
  qid?: number;
  ppid?: number;
}

export const DeleteQP = async ({
  pid,
  qid,
  ppid,
}: deletepolicytype): Promise<returntype> => {
  try {
    if (!pid && !qid && !ppid) {
      return { success: false, message: "Invalid request" };
    }

    if (qid) {
      await Prisma.question.delete({ where: { id: qid } });
    } else if (pid && !ppid) {
      await Prisma.policy.delete({ where: { id: pid } });
    } else if (pid && ppid) {
      await Prisma.paragraph.delete({ where: { id: ppid } });
      await Prisma.policy.delete({ where: { id: pid } });
    }

    return { success: true, message: "Delete successfully" };
  } catch (error) {
    console.log("Delete Policy", error);
    return { success: false, message: "Error occured" };
  }
};
