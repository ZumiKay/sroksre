// Create a new file: src/app/component/ClientProviders.tsx
"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "../../context/SocketContext";
import { HeroUIProvider } from "@heroui/system";
import { GlobalContextProvider } from "../../context/GlobalContext";
import { ToastContainer } from "react-toastify";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <GlobalContextProvider>
      <HeroUIProvider>
        <SessionProvider>
          <SocketProvider>
            <ToastContainer />
            {children}
          </SocketProvider>
        </SessionProvider>
      </HeroUIProvider>
    </GlobalContextProvider>
  );
}
