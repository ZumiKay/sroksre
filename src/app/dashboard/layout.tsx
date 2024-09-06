import { getUser } from "@/src/context/OrderContext";

import TopModal from "./TopModal";

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ContainerLoading } from "../component/Loading";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getUser();

  if (!session) {
    return redirect("/account");
  }

  return (
    <section className="min-h-screen w-full h-full">
      <TopModal />

      {/* <DashboordNavBar session={session ?? undefined} /> */}

      <Suspense fallback={<ContainerLoading />}>{children}</Suspense>
    </section>
  );
};

export default DashboardLayout;
