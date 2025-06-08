/* eslint-disable @typescript-eslint/no-explicit-any */
import { BannerState } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import {
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import prismatype from "@prisma/client";
import { del } from "@vercel/blob";
import { NextRequest } from "next/server";
import { getUser } from "../../action";
import { z } from "zod";

const ImageSchema = z.object({
  id: z.number(),
  url: z.string().url().trim(),
  name: z.string().trim().max(255),
  type: z.string().trim().max(50),
});

const SelectOptionSchema = z.object({
  value: z.number().int().positive(),
  label: z.string().trim(),
});

const BannerStateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(50),
  size: z.string().trim().max(50),
  selectedproduct: z.array(SelectOptionSchema).optional().nullable(),
  parentcate: SelectOptionSchema.optional().nullable(),
  childcate: SelectOptionSchema.optional().nullable(),
  linktype: z.string().optional(),
  Image: ImageSchema,
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the incoming data
    const rawData = await request.json();

    // Validate the data against our schema
    const validatedData = BannerStateSchema.parse(rawData);

    // Prepare sanitized data for database
    const createData = {
      name: validatedData.name,
      type: validatedData.type,
      size: validatedData.size,
      selectedproduct_id:
        validatedData.selectedproduct?.map((i) => i.value) || [],
      parentcate_id: validatedData.parentcate?.value || null,
      childcate_id: validatedData.childcate?.value || null,
      linktype: validatedData.linktype,
    };

    // Create the banner with sanitized data
    const create = await Prisma.banner.create({
      data: createData,
    });

    // Create Image if needed
    if (validatedData.Image.id) {
      const user = await getUser();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      await Prisma.image.update({
        where: { id: validatedData.Image.id },
        data: {
          temp: false,
          bannerId: create.id,
        },
      });
    }

    return Response.json({ data: { id: create.id } }, { status: 200 });
  } catch (error) {
    console.error("Create Banner Error:", error);

    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      return Response.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    // Generic error
    return Response.json(
      { message: "Failed To Create Banner" },
      { status: 500 }
    );
  }
}

interface Updatebannerprops extends BannerState {
  Ids?: { id: number; show: boolean }[];
  edittype?: string;
}

const CommonSelectBannerProps: prismatype.Prisma.BannerSelect = {
  id: true,
  name: true,
  type: true,
  Image: {
    select: {
      url: true,
      name: true,
      type: true,
    },
  },
  link: true,
  linktype: true,
  parentcate_id: true,
  childcate_id: true,
  selectedproduct_id: true,
  size: true,
};

export async function PUT(request: NextRequest) {
  try {
    const updatedata: Updatebannerprops = await request.json();

    if (updatedata.id) {
      if (updatedata.edittype) {
        if (updatedata.edittype === "cover") {
          const prevItem = await Prisma.image.findUnique({
            where: { bannerId: updatedata.id },
            select: {
              url: true,
            },
          });
          if (prevItem) {
            ///Remove Old Image
            await Prisma.image.delete({ where: { bannerId: updatedata.id } });
            await del(prevItem.url);
          }

          /// Link New Image
          await Prisma.image.update({
            where: { id: updatedata.Image.id },
            data: {
              bannerId: updatedata.id,
            },
          });
        }
      } else {
        const isBanner = await Prisma.banner.findUnique({
          where: {
            id: updatedata.id,
          },
          select: CommonSelectBannerProps,
        });
        if (!isBanner) {
          return new Response(null, { status: 404 });
        }
        if (
          JSON.stringify(isBanner.Image) !== JSON.stringify(updatedata.Image)
        ) {
          const user = await getUser();
          if (user)
            await Prisma.image.create({
              data: {
                url: updatedata.Image.url,
                name: updatedata.Image.name,
                type: updatedata.Image.type as string,
                temp: false,
                userId: user?.id,
              },
            });
        }

        if (JSON.stringify(isBanner) !== JSON.stringify(updatedata))
          await Prisma.banner.update({
            where: {
              id: isBanner.id,
            },
            data: {
              name: updatedata.name,
              type: updatedata.type,
              size: updatedata.size,
              linktype: updatedata.linktype,
              link: updatedata.link,
              parentcate_id: updatedata.parentcate?.value as number,
              childcate_id: updatedata.childcate?.value as number,
              selectedproduct_id: updatedata.selectedproduct?.map(
                (i) => i.value
              ),
            },
          });
      }
    }

    return Response.json({ message: "Banner Updated" }, { status: 200 });
  } catch (error) {
    console.log("Update Banner", error);
    return Response.json({ message: "Failed To Update" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    const isBanner = await Prisma.banner.findUnique({
      where: { id },
      select: {
        id: true,
        Image: CommonSelectBannerProps.Image,
      },
    });
    if (!isBanner) {
      return Response.json({ messasge: "Banner Not Found" }, { status: 500 });
    }

    if (isBanner.Image) await del(isBanner.Image?.url);
    await Prisma.banner.delete({ where: { id } });

    return Response.json({ message: "Banner Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Banner", error);
    return Response.json({ message: "Failed to Delete" }, { status: 500 });
  }
}

//GET BANNER

export function extractQueryParams(
  url: string
): Record<string, string | number | boolean | string[]> {
  // Handle invalid input
  if (typeof url !== "string" || !url) {
    return {};
  }

  // Extract query string safely
  const queryString = url.split("?")[1];
  if (!queryString) {
    return {};
  }

  const queryParams: Record<string, string | number | boolean | string[]> = {};

  try {
    const paramsArray = queryString.split("&").filter((param) => param); // Remove empty entries

    paramsArray.forEach((param) => {
      // Handle cases where there's no = sign or empty values
      const [key, value] = param.split("=");
      if (!key) return; // Skip if no key

      // Decode URI component to handle encoded characters
      const decodedValue = value !== undefined ? decodeURIComponent(value) : "";

      // Parse the value based on its content
      if (decodedValue === "") {
        queryParams[key] = "";
      }
      // Handle boolean values
      else if (decodedValue.toLowerCase() === "true") {
        queryParams[key] = true;
      } else if (decodedValue.toLowerCase() === "false") {
        queryParams[key] = false;
      }
      // Handle comma-separated arrays
      else if (decodedValue.includes(",")) {
        queryParams[key] = decodedValue.split(",").map((item) => item.trim());
      }
      // Handle numeric values
      else if (!isNaN(Number(decodedValue)) && decodedValue !== "") {
        queryParams[key] = Number(decodedValue);
      }
      // Default to string
      else {
        queryParams[key] = decodedValue;
      }
    });

    return queryParams;
  } catch (error) {
    console.error("Error parsing query parameters:", error);
    return {};
  }
}
const getBannerData = async (id: Array<number>, model: any) => {
  const data = await model.findMany({
    where: {
      id: {
        in: id,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
  return data ? data.map((i: any) => ({ value: i.id, label: i.name })) : null;
};
export async function GET(request: NextRequest) {
  const params = request.url.toString();
  const param: {
    limit?: number;
    ty?: string;
    p?: number;
    q?: string;
    bty?: string;
    bs?: string;
    promoselect?: number;
  } = extractQueryParams(params);

  try {
    const total = await Prisma.banner.count({
      where: {
        type: param.bty,
        size: param.bs,
        name: param.q && {
          contains: removeSpaceAndToLowerCase(param.q),
          mode: "insensitive",
        },
      },
    });
    const itemperpage = param.limit ?? 0;
    const { startIndex, endIndex } = calculatePagination(
      total,
      param.limit as number,
      param.p as number
    );

    let result;
    if (param.ty === "edit") {
      result = await Prisma.banner.findUnique({
        where: { id: param.p },
        select: CommonSelectBannerProps,
      });

      if (
        result?.childcate_id ||
        result?.parentcate_id ||
        result?.selectedproduct_id
      ) {
        result = {
          ...result,
          name: result.name,
          type: result.type,
          Image: result.Image,
          parentcate: result.parentcate_id
            ? (
                await getBannerData(
                  [result.parentcate_id],
                  Prisma.parentcategories
                )
              )[0]
            : undefined,
          childcate: result.childcate_id
            ? (
                await getBannerData(
                  [result.childcate_id],
                  Prisma.childcategories
                )
              )[0]
            : undefined,
          selectedproduct: result.selectedproduct_id
            ? await getBannerData(
                result.selectedproduct_id as Array<number>,
                Prisma.products
              )
            : undefined,
        };
      }
    } else {
      result = (
        await Prisma.banner.findMany({
          where: {
            type: param.bty,
            size: param.bs,
            name: param.q && {
              contains: removeSpaceAndToLowerCase(param.q),
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            Image: CommonSelectBannerProps.Image,
            size: true,
            linktype: true,
          },
          take: endIndex - startIndex + 1,
          skip: startIndex,
        })
      ).map((i) => ({
        ...i,
        linktype:
          i.linktype === "parent" || i.linktype === "sub"
            ? `${i.linktype.toUpperCase()} / CATEGORY`
            : i.linktype,
      }));
    }

    return Response.json(
      {
        data: result,
        total: total,
        totalpage: Math.ceil(total / itemperpage),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Fetch Banner", error);
    return Response.json(
      { message: "Failed To Fetch Banner" },
      { status: 500 }
    );
  }
}
