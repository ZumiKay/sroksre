"use server";

import Prisma from "@/src/lib/prisma";

interface returntype {
  success: boolean;
  message?: string;
}

export interface ParagraphType {
  id?: number;
  title?: string;
  content: string;
}

export interface Addpolicytype {
  id?: number;
  title: string;
  showtype?: string[];
  Paragraph: Array<ParagraphType>;
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

    // Check if we have either valid questions or a valid policy
    if (question) {
      // Validate question data
      if (!Array.isArray(question) || question.length === 0) {
        return {
          success: false,
          message: "Invalid request: Question data must be a non-empty array",
        };
      }

      // Create questions in a single database operation
      await Prisma.question.createMany({
        data: question.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
      });

      return { success: true, message: "Questions created successfully" };
    }

    if (policy) {
      // Validate policy data
      if (!policy.title || !policy.Paragraph || policy.Paragraph.length === 0) {
        return {
          success: false,
          message: "Invalid request: Policy must have a title and paragraphs",
        };
      }

      // Create policy with paragraphs in a single database operation
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

      return { success: true, message: "Policy created successfully" };
    }

    // If neither question nor policy is provided
    return {
      success: false,
      message:
        "Invalid request: Either question or policy data must be provided",
    };
  } catch (error) {
    console.error("Create Policy/Question Error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? `Error: ${error.message}`
          : "An unexpected error occurred",
    };
  }
};
