import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import z from "zod";
import { extractQueryParams } from "../../../banner/route";
import { getUser } from "@/src/app/action";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  houseId: z.string().min(1, "HouseId is required"),
  district: z.string().min(1, "District is required"),
  postalcode: z.string().min(1, "Postal code is required"),
  songkhat: z.string().min(1, "Sangkat is required"),
  province: z.string().min(1, "Province / City is requried"),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  // Add any other fields that are part of your Address model
});

// For PUT, create a partial schema that makes all fields optional
const addressUpdateSchema = addressSchema.partial().extend({
  // Require the ID for the update operation
  id: z.number().min(1, "Address ID is required"),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createErrorResponse = (message: string, details?: any, status = 500) => {
  return Response.json(
    { error: message, ...(details && { details }) },
    { status }
  );
};

// Authentication check helper
const authenticateUser = async () => {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user;
};

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const user = await authenticateUser();

    // Validate the input data against the schema
    const result = addressSchema.safeParse(rawData);

    if (!result.success) {
      return createErrorResponse(
        "Invalid input",
        { details: result.error.format() },
        400
      );
    }

    // Create address with validated data
    await Prisma.address.create({
      data: { ...result.data, userId: user.id },
    });

    return Response.json({ message: "Address Created" }, { status: 201 });
  } catch (error) {
    console.error("Create Address:", error);

    if (error instanceof Error && error.message === "Unauthenticated") {
      return createErrorResponse("Unauthenticated", null, 401);
    }

    return createErrorResponse("Error Occurred");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const rawData = await req.json();
    const user = await authenticateUser();

    // Validate the input data against the partial schema
    const result = addressUpdateSchema.safeParse(rawData);

    if (!result.success) {
      return createErrorResponse(
        "Invalid input",
        { details: result.error.format() },
        400
      );
    }

    // Extract the ID and the fields to update
    const { id, ...updateData } = result.data;

    // Verify that the address belongs to the current user and update in one operation
    const updatedAddress = await Prisma.address.updateMany({
      where: {
        id,
        userId: user.id, // This ensures the address belongs to the user
      },
      data: updateData,
    });

    if (!updatedAddress.count) {
      return createErrorResponse(
        "Address not found or not authorized",
        null,
        404
      );
    }

    return Response.json({ message: "Address Updated" }, { status: 200 });
  } catch (error) {
    console.error("Edit Address:", error);

    if (error instanceof Error && error.message === "Unauthenticated") {
      return createErrorResponse("Unauthenticated", null, 401);
    }

    return createErrorResponse("Error Occurred");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const rawData = await req.json();

    const user = await getUser();

    if (!user) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Validate the input data against the delete schema
    const result = addressUpdateSchema.safeParse(rawData);

    if (!result.success) {
      // Return validation errors
      return Response.json(
        {
          error: "Invalid input",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { id } = result.data;

    // Verify that the address belongs to the current user before deletion
    const existingAddress = await Prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return Response.json(
        { error: "Address not found or not authorized" },
        { status: 404 }
      );
    }

    // Delete the address
    await Prisma.address.delete({
      where: { id },
    });

    return Response.json({ message: "Address Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Address", error);
    return Response.json({ error: "Error Occurred" }, { status: 500 });
  }
}

type GetAddressType = {
  id?: number;
};
export async function GET(req: NextRequest) {
  try {
    const { id } = extractQueryParams(req.nextUrl.toString()) as GetAddressType;

    if (id) {
      const address = await Prisma.address.findFirst({ where: { id } });

      if (!address) {
        return new Error("Address not found");
      }
      return Response.json({ data: address }, { status: 200 });
    }

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Fetch Userinfo", error);

    return Response.json({}, { status: 500 });
  }
}
