"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { DashboordNavBar } from "../component/Navbar";
import { ConfirmModal } from "../component/SideMenu";
import { UpdateStockModal } from "../component/Modals";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { openmodal } = useGlobalContext();
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <section className="min-h-screen h-fit w-full">
        {openmodal.confirmmodal.open && <ConfirmModal />}
        {openmodal.updatestock && <UpdateStockModal />}

        <DashboordNavBar />

        {children}
      </section>
    </LocalizationProvider>
  );
};

export default DashboardLayout;
