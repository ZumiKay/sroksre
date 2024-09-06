import ProductDetail from "./ClientComponent";

import { notFound } from "next/navigation";
import { getUser } from "@/src/context/OrderContext";
import { IsNumber } from "@/src/lib/utilities";

export default async function DetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | undefined };
}) {
  const { rl } = searchParams as any;

  const user = await getUser();

  if (rl && !IsNumber(rl)) {
    return notFound();
  }

  if (!IsNumber(params.id.toString())) {
    return notFound();
  }

  return <ProductDetail params={params} isAdmin={user?.role === "ADMIN"} />;
}
