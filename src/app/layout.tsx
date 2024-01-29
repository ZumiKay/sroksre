import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import Provider from "./provider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalContextProvider } from "../context/GlobalContext";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";

const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <Provider>
            <Navbar />
            <ToastContainer />

            {children}
            <Footer />
          </Provider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
