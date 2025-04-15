import TopModal from "./TopModal";
import { Metadata } from "next";
import Prisma from "@/src/lib/prisma";
import { getUser } from "../action";

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
  return (
    <main className="min-h-screen w-full h-full">
      <TopModal />
      {children}
    </main>
  );
};

export default DashboardLayout;
