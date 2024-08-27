import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalContextProvider } from "../context/GlobalContext";
import { getUser } from "../context/OrderContext";
import { NextUIProvider } from "@nextui-org/react";
import { Suspense } from "react";
import Loading from "./loading";
import { LayoutTransition } from "./component/Layout";
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
            <Suspense fallback={<ContainerLoading />}>
              <div className="w-full h-full relative">
                <Navbar session={session as any} />
                <ToastContainer />{" "}
                <LayoutTransition
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {children}
                </LayoutTransition>
                <Footer />
              </div>
            </Suspense>
          </NextUIProvider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
