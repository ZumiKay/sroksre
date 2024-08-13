import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalContextProvider } from "../context/GlobalContext";
import { CartIndicator } from "./component/ServerComponents";
import { getUser } from "../context/OrderContext";
import { NextUIProvider } from "@nextui-org/react";
import { Suspense } from "react";
import { ContainerLoading } from "./component/Loading";

const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Srok Sre",
  description: "Online Store",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUser();

  return (
    <html lang="en">
      <head>
        <script
          src="https://kit.fontawesome.com/3a73dd3b99.js"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={prompt.className}
        style={{ minHeight: "100vh", height: "100%", width: "100%" }}
      >
        <GlobalContextProvider>
          {" "}
          <NextUIProvider>
            <div className="w-full h-full relative">
              <Navbar session={session ?? undefined} />
              <ToastContainer />
              <Suspense fallback={<ContainerLoading />}>{children}</Suspense>
              <Footer />
            </div>
          </NextUIProvider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
