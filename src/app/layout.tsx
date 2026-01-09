import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import NavbarWrapper from "./component/NavbarWrapper";
import Footer from "./component/Footer";
import { ToastContainer } from "react-toastify";
import { GlobalContextProvider } from "../context/GlobalContext";
import { NextUIProvider } from "@nextui-org/react";
import { Suspense } from "react";
import { ContainerLoading } from "./component/Loading";
import { SocketProvider } from "../context/SocketContext";
import "../app/globals.css";
import "react-toastify/ReactToastify.css";
import Provider from "./provider";
const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Srok Sre - Online Store",
    template: "%s | Srok Sre",
  },
  description:
    "Srok Sre - Your trusted online store for quality products. Shop the latest collections and enjoy seamless shopping experience.",
  keywords: ["online store", "e-commerce", "shopping", "products", "Srok Sre"],
  authors: [{ name: "Zumi" }],
  creator: "Zumi",
  publisher: "Srok Sre",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Srok Sre - Online Store",
    description:
      "Your trusted online store for quality products. Shop the latest collections.",
    url: "/",
    siteName: "Srok Sre",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
        width: 1200,
        height: 630,
        alt: "Srok Sre Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Srok Sre - Online Store",
    description:
      "Your trusted online store for quality products. Shop the latest collections.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
    shortcut:
      "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
    apple:
      "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050",
  },
  verification: {
    // Add your verification tokens here
    // google: "google-site-verification-token",
    // yandex: "yandex-verification-token",
    // bing: "bing-verification-token",
  },
};

export default async function RootLayout({
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
      <body
        className={prompt.className}
        style={{
          minHeight: "100vh",
          height: "100%",
          width: "100%",
        }}
      >
        <GlobalContextProvider>
          <NextUIProvider>
            <Provider>
              <Suspense fallback={<ContainerLoading />}>
                <SocketProvider>
                  <div id="main" className="w-full h-full relative">
                    <ToastContainer />
                    <NavbarWrapper />
                    {children}
                    <Footer />
                  </div>
                </SocketProvider>
              </Suspense>
            </Provider>
          </NextUIProvider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
