import { userdata } from "@/src/context/GlobalContext";
import { Createadmin } from "@/src/lib/adminlib";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const data: userdata = await request.json();

  const createadmin = await Createadmin(data);
  if (createadmin) {
    return Response.json({ message: "Admin Created" }, { status: 200 });
  } else {
    return Response.error();
  }
}
