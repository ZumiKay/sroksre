import { DeleteImageFromStorage } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
interface Deleteimagedata {
  names: Array<string>;
}
export async function DELETE(req: NextRequest) {
  try {
    const data: Deleteimagedata = await req.json();
    if (!data) {
      return Response.json({ message: "Nothing To Delete" }, { status: 403 });
    }

    await Promise.all(data.names.map((i) => DeleteImageFromStorage(i)));

    return Response.json({ message: "Delete Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Delete Image", error);
    return Response.json({ message: "Error Delete Image" }, { status: 500 });
  }
}
