import { getUser } from "@/src/context/OrderContext";
import { DashboordNavBar } from "../component/Navbar";

import TopModal from "./TopModal";

import { redirect } from "next/navigation";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getUser();

  if (!session) {
    return redirect("/account");
  }

  return (
    <section className="min-h-screen w-full h-fit">
      <TopModal />

      {/* <DashboordNavBar session={session ?? undefined} /> */}
      {children}
    </section>
  );
};

export default DashboardLayout;
