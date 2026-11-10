import { Metadata } from "next";
import SecuritySettings from "./SecuritySettings";

export const metadata: Metadata = {
  title: "Security | Dashboard",
  description: "Two-factor login for admin accounts",
};

export default function SecurityPage() {
  return <SecuritySettings />;
}
