"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface ProviderPropsType {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Provider({ children, session }: ProviderPropsType) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
