import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
  } catch (error) {
    console.error("Creat Product", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
export async function PUT() {}
export async function GET() {}

export async function DELETE() {}
