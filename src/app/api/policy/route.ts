import Prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Addpolicytype, Addquestiontype } from "../../privacyandpolicy/action";
import { extractQueryParams } from "../banner/route";
import { Policy, Question, Prisma as prisma } from "@prisma/client";

export type showtype = "productdetail" | "email" | "footer" | "checkout";

interface Updatedata {
  id?: number;
  showtype?: showtype;
  type?: "question" | "policy";
  ty: string;
  question?: Addquestiontype;
  policy?: Addpolicytype;
}
export async function PUT(req: NextRequest) {
  try {
    const { id, showtype, type, ty, question, policy }: Updatedata =
      await req.json();

    if (!ty) {
      return NextResponse.json(
        { message: "Missing update type" },
        { status: 400 }
      );
    }

    if (ty === "detail") {
      if (type === "question") {
        if (!question?.id) {
          return NextResponse.json(
            { message: "Missing question ID" },
            { status: 400 }
          );
        }

        await Prisma.question.update({
          where: { id: question.id },
          data: {
            question: question.question,
            answer: question.answer,
          },
        });
      } else {
        if (!policy?.id) {
          return NextResponse.json(
            { message: "Missing policy ID" },
            { status: 400 }
          );
        }

        if (policy.Paragraph && policy.Paragraph.length > 0) {
          await Promise.all(
            policy.Paragraph.map((paragraph) =>
              Prisma.paragraph.upsert({
                where: { id: paragraph.id || 0 },
                update: {
                  title: paragraph.title,
                  content: paragraph.content,
                },
                create: {
                  title: paragraph.title,
                  content: paragraph.content,
                  policyId: policy.id as number,
                },
              })
            )
          );
        }
      }
    } else if (ty === "showtype") {
      // Validate showtype update data
      if (!id) {
        return NextResponse.json(
          { message: "Missing policy ID" },
          { status: 400 }
        );
      }

      await Prisma.policy.update({
        where: { id },
        data: { showtype },
      });
    } else {
      return NextResponse.json(
        { message: "Invalid update type" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Updated Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Policy Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { message: `Error updating policy: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const getPolicesByPage = async (page: showtype) =>
  await Prisma.policy.findMany({
    where: {
      showtype: {
        contains: page,
        mode: "insensitive",
      },
    },
    select:
      page !== "productdetail"
        ? { id: true, title: true }
        : {
            id: true,
            title: true,
            showtype: true,
            Paragraph: {
              select: {
                title: true,
                content: true,
              },
            },
          },
  });

interface PolicyParamType {
  id?: number;
  type?: "all" | "id" | "faq";
}
export async function GET(req: NextRequest) {
  try {
    const url = req.url.toString();
    const { id, type } = extractQueryParams(url) as unknown as PolicyParamType;

    if (!type || !["all", "faq", "id"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    if (type === "id" && !id) {
      return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }

    let result:
      | Policy
      | Array<Policy>
      | Array<Question>
      | Record<string, unknown>
      | null;

    switch (type) {
      case "all":
        result = (
          await Prisma.policy.findMany({
            select: { id: true, title: true },
          })
        ).filter((i) => i.title.length > 0) as never;
        break;
      case "faq":
        result = await Prisma.question.findMany();
        break;
      case "id":
        result =
          (await Prisma.policy.findUnique({
            where: { id },
            include: { Paragraph: true },
          })) ?? {};
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error("Fetch Policy Error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching policy data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = req.url.toString();
    const { id, type } = extractQueryParams(url);

    // Validate required parameters
    if (
      !type ||
      !["policy", "question", "paragraph"].includes(type as string)
    ) {
      return NextResponse.json(
        { message: "Invalid type parameter" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const parsedId = parseInt(id as string, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    switch (type) {
      case "policy":
        // Delete policy and all associated paragraphs
        await Prisma.policy.delete({
          where: { id: parsedId },
        });
        break;

      case "question":
        await Prisma.question.delete({
          where: { id: parsedId },
        });
        break;

      case "paragraph":
        await Prisma.paragraph.delete({
          where: { id: parsedId },
        });
        break;

      default:
        return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json(
      { message: `${type} deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `Delete ${error instanceof Error ? error.message : "Error"}:`,
      error
    );

    // Check for specific Prisma errors
    if (error instanceof prisma.PrismaClientKnownRequestError) {
      // P2025 is "Record not found"
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Record not found" },
          { status: 404 }
        );
      }
      // P2003 is foreign key constraint failed - likely when trying to delete something referenced elsewhere
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message: "Cannot delete: this item is referenced by other records",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
