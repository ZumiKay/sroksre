"use server";
import { getUser } from "@/src/lib/session";
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
    <section className="min-h-screen w-full h-full bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-full">
        {/* Content Wrapper with max-width and centering */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </section>
  );
};

export default DashboardLayout;
