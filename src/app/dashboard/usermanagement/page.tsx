"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { UserCard } from "../../component/Card";
import { Createusermodal } from "../../component/Modals";

export default function UsermanagementPage() {
  const { openmodal, setopenmodal } = useGlobalContext();
  const handleAdd = () => {
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  };
  return (
    <div className="usermanagement_container w-full h-full">
      <header className="usermanagement_heade w-[280px] h-fit p-3 flex flex-row gap-x-5">
        <PrimaryButton
          type="button"
          text="Add"
          onClick={() => handleAdd()}
          color="#0097FA"
          Icon={<i className="fa-solid fa-plus font-bold text-lg"></i>}
          width="100%"
          radius="10px"
        />
        <PrimaryButton
          color="#4688A0"
          radius="10px"
          type="button"
          text={"Filter"}
          width="100%"
        />
      </header>
      <div className="userlist w-full h-full grid grid-cols-3 gap-x-10 place-items-center mt-5">
        <UserCard />
        <UserCard />
        <UserCard />
      </div>

      {openmodal.createUser && <Createusermodal />}
    </div>
  );
}
