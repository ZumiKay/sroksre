import { registerUser } from "@/src/lib/userlib";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const userdata: any = await req.json();
    const user = await registerUser(userdata);
    if (user === true) {
      return Response.json({ message: "Registered" }, { status: 200 });
    } else {
      return Response.json({ message: user?.message }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ message: error }, { status: 500 });
  }
}
