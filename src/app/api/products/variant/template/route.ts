import { VariantTemplateType } from "@/src/app/component/Modals/Variantcomponent/Action";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../../banner/route";
import { VariantColorValueType } from "@/src/context/GlobalContext";

export async function PUT(req: NextRequest) {
  const { id, variant } = (await req.json()) as VariantTemplateType;

  try {
    const temp = await Prisma.varianttemplate.findUnique({
      where: { id },
      include: { variant: true },
    });

    if (!temp) {
      return Response.json(
        { message: "Not found" },
        {
          status: 404,
        }
      );
    }

    if (variant) {
      const variantChanged = Object.entries(temp.variant).some(([key, val]) => {
        if (key === "option_value") {
          if (temp.variant.option_type === "COLOR") {
            const tempValues = val as unknown as VariantColorValueType[];
            const variantValues =
              variant.option_value as VariantColorValueType[];

            return tempValues.some((tempVal) =>
              variantValues.some(
                (variantVal) =>
                  variantVal.val !== tempVal.val ||
                  variantVal.name !== tempVal.name
              )
            );
          } else {
            const tempValues = val as string[];
            return tempValues.some(
              (tempVal) => !variant.option_value.includes(tempVal)
            );
          }
        } else {
          return variant[key] !== val;
        }
      });

      if (variantChanged) {
        await Prisma.variant.update({
          where: { id: variant.id },
          data: {
            option_title: variant.option_title,
            option_type: variant.option_type,
            option_value: variant.option_value as any,
          },
        });
      }
    }

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.error("Variant Template Edit Error:", error);
    return Response.json(
      { message: "Error occured" },
      {
        status: 500,
      }
    );
  }
}

interface VariantTemplateParam {
  ty?: "short" | "detail";
  id?: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParam = req.url.toString();
    const { ty, id } = extractQueryParams(
      searchParam
    ) as unknown as VariantTemplateParam;

    if (!ty) {
      return Response.json({}, { status: 400 });
    }

    let data;
    if (ty === "short") {
      data = await Prisma.varianttemplate.findMany({
        select: {
          id: true,
          variant: {
            select: {
              id: true,
              option_title: true,
              option_type: true,
              option_value: true,
            },
          },
        },
      });

      return Response.json({ data }, { status: 200 });
    } else if (id) {
      data = await Prisma.varianttemplate.findUnique({
        where: {
          id: parseInt(id),
        },
        include: { variant: true },
      });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.log("Variant Template", error);
    return Response.json({}, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return Response.json({}, { status: 400 });
    }
    await Prisma.varianttemplate.delete({ where: { id } });

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Variant Template", error);
    return Response.json({}, { status: 500 });
  }
}
