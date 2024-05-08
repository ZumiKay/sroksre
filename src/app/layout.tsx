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
      <body className={prompt.className} style={{ minHeight: "100vh" }}>
        <GlobalContextProvider>
          {" "}
          <Navbar session={session ?? undefined}>
            <CartIndicator />
          </Navbar>
          <ToastContainer />
          {children}
          <Footer />
        </GlobalContextProvider>
      </body>
    </html>
  );
}
