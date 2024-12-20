import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { GlobalContextProvider } from "../context/GlobalContext";
import { getUser } from "../context/OrderContext";
import { NextUIProvider } from "@nextui-org/react";
import { Suspense } from "react";
import { ContainerLoading } from "./component/Loading";
import { SocketProvider } from "../context/SocketContext";
const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Srok Sre",
  description: "Online Store",
  icons:
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
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
        style={{
          minHeight: "100vh",
          height: "100%",
          width: "100%",
        }}
      >
        <GlobalContextProvider>
          {" "}
          <NextUIProvider>
            <Suspense fallback={<ContainerLoading />}>
              <SocketProvider>
                <div id="main" className="w-full h-full relative">
                  <ToastContainer />
                  <Navbar session={session as any} />
                  {children}
                  <Footer />
                </div>
              </SocketProvider>
            </Suspense>
          </NextUIProvider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
