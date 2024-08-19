"use server";

import Prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

interface returntype {
  success: boolean;
  message?: string;
}

export interface Addpolicytype {
  id?: number;
  title: string;
  Paragraph: {
    id?: number;
    title?: string;
    content: string;
  }[];
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
              data: policy.Paragraph.map((p) => ({
                title: p.title,
                content: p.content,
              })),
            },
          },
        },
      });
    } else {
      return { success: false, message: "Invalid request" };
    }

    revalidatePath("/privacyandpolicy");

    return { success: true, message: "Created Successfully" };
  } catch (error) {
    console.log("Create Policy Error", error);
    return { success: false, message: "Error Occured" };
  }
};

export const getPolicy = async (qid?: number, pid?: number) => {
  if (!qid && !pid) {
    return { success: false, message: "Invalid data" };
  }

  const result = await (qid
    ? Prisma.question.findUnique({ where: { id: qid } })
    : Prisma.policy.findUnique({
        where: { id: pid },
        include: { Paragraph: true },
      }));

  return { success: true, data: result };
};

export const updateQuestionOrPolicy = async (
  type: "question" | "policy",
  question?: Addquestiontype,
  policy?: Addpolicytype
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
      if (policy?.Paragraph && policy.Paragraph.length > 0) {
        await Promise.all(
          policy.Paragraph.map((i) =>
            Prisma.paragraph.upsert({
              where: { id: i.id || 0 },
              update: { title: i.title, content: i.content },
              create: {
                title: i.title,
                policyId: policy?.id as number,
                content: i.content,
              },
            })
          )
        );
      }
    }
    revalidatePath("/privacyandpolicy");
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
    } else if (pid || ppid) {
      ppid && (await Prisma.paragraph.delete({ where: { id: ppid } }));
      pid && (await Prisma.policy.delete({ where: { id: pid } }));
    }

    revalidatePath("/privacyandpolicy");
    return { success: true, message: "Delete successfully" };
  } catch (error) {
    console.log("Delete Policy", error);
    return { success: false, message: "Error occured" };
  }
};

export const getAllPolicy = async () => {
  const result = await Prisma.policy.findMany({
    select: {
      id: true,
      title: true,
    },
  });
  return result;
};

export const getPolicyById = async (id: number) => {
  if (id === 0) {
    const questions = await Prisma.question.findMany({
      select: {
        id: true,
        question: true,
        answer: true,
      },
    });
    return questions;
  }

  const result = await Prisma.policy.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      Paragraph: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          title: true,
          content: true,
        },
      },
    },
  });

  return result;
};
