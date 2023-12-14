import Modal from "../component/Modals";
import { DashboordNavBar } from "../component/Navbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="min-h-screen w-full">
      <DashboordNavBar />
      {children}
      
    </section>
  );
};

export default DashboardLayout;
