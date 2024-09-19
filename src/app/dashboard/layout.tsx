import { getUser } from "@/src/context/OrderContext";
import TopModal from "./TopModal";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Prisma from "@/src/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getUser();

  const data = await Prisma.user.findUnique({ where: { id: user?.id } });
  let title = "";
  if (data) {
    title =
      user?.role === "ADMIN"
        ? `Admin Dashboard | SrokSre`
        : `${data.firstname} ${data.lastname ?? ""} Dashboard | SrokSre`;
  }
  return {
    title: title,
    description:
      "Change and View User Email , Firstname , Lastname, Wishlist Products, and Delete Account",
  };
}

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getUser();

  if (!session) {
    return redirect("/account");
  }

  return (
    <section className="min-h-screen w-full h-full">
      <TopModal />
      {children}
    </section>
  );
};

export default DashboardLayout;
