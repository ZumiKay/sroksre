import { Metadata } from "next";
import DeviceManagement from "./DeviceManagement";

export const metadata: Metadata = {
  title: "Device Management | Dashboard",
  description: "Manage your active sessions and devices",
};

export default function DevicesPage() {
  return <DeviceManagement />;
}
