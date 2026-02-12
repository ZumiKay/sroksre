"use server";
import { getUser } from "@/src/lib/session";
import { Metadata } from "next";
import Prisma from "@/src/lib/prisma";
import { Role } from "@/prisma/generated/prisma/enums";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getUser({
    user: {
      select: {
        id: true,
        role: true,
      },
    },
  });

  if (!user || !user.userId || !user.sessionid) {
    return { title: "", description: "" };
  }

  const data = await Prisma.user.findUnique({ where: { id: user.user.id } });
  let title = "";
  if (data) {
    title =
      user.user.role === Role.ADMIN
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
    <section className="min-h-screem min-w-screen w-full h-full bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-full">
        {/* Content Wrapper with max-width and centering */}
        {children}
      </div>
    </section>
  );
};

export default DashboardLayout;
