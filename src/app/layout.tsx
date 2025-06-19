import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import Footer from "./component/Footer";
import { Suspense } from "react";
import { ContainerLoading } from "./component/Loading";
import Navbar from "./component/Navbar/Navbar";
import ClientProviders from "@/src/app/component/ClientProvider";
import "./globals.css";
import { GetCartCount } from "./action";
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
  const cartCount = await GetCartCount();
  return (
    <html lang="en">
      <head>
        <script
          async
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
        <Suspense fallback={<ContainerLoading />}>
          <ClientProviders>
            <div id="main" className="w-full h-full relative">
              <Navbar cartcount={cartCount} />
              {children}
            </div>
          </ClientProviders>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
