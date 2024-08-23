import Prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Addpolicytype, Addquestiontype } from "../../privacyandpolicy/action";
import { extractQueryParams } from "../banner/route";

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
  const { id, showtype, type, ty, question, policy }: Updatedata =
    await req.json();

  try {
    if (ty === "detail") {
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
    } else if (ty === "showtype") {
      await Prisma.policy.update({ where: { id }, data: { showtype } });
    }
    return NextResponse.json(
      { message: "Updated Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Update Policy", error);
    return NextResponse.json({ message: "Error Occured" }, { status: 500 });
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
      page === "footer" || page === "checkout"
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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.toString();
  const param = extractQueryParams(url);

  if (!param.type) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const result = await getPolicesByPage(param.type as showtype);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch Policy", error);
    return NextResponse.json({ message: "Error Occured" }, { status: 500 });
  }
}
