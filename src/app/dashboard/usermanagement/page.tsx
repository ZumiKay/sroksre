"use client";
import {
  FiltervalueInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { UserCard } from "../../component/Card";
import { Createusermodal } from "../../component/Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import { LoadingText, errorToast } from "../../component/Loading";
import { useEffect, useState } from "react";
import PaginationComponent from "../../component/Pagination";
import { FilterMenu } from "../../component/SideMenu";

export default function UsermanagementPage() {
  const {
    openmodal,
    setopenmodal,
    itemlength,
    setitemlength,
    allfiltervalue,
    setallfilterval,
    setisLoading,
    setalldata,
    allData,
    isLoading,
  } = useGlobalContext();
  const handleAdd = () => {
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  };
  const [page, setpage] = useState(1);
  const [showperpage, setshow] = useState(1);

  useEffect(() => {
    fetchdata();
  }, [allfiltervalue, page, allData.user.length]);
  const fetchdata = async () => {
    const allfil = [...allfiltervalue];
    const Isfil = allfil.findIndex((i) => i.page === "usermanagement");
    if (Isfil === -1) {
      allfil.push({ page: "usermanagement", filter: FiltervalueInitialize });
      setallfilterval(allfil);
    }

    const { name, email, page } =
      allfiltervalue.find((i) => i.page === "usermanagement")?.filter ?? {};
    const URL = `/api/auth/users?${name || email ? `ty="filter"` : `ty=all`}${
      name ? `&n=${name}` : ""
    }${email ? `&e=${email}` : ""}${`&p=${page ?? 1}`}${`&lt=${showperpage}`}`;
    const user = await ApiRequest(URL, setisLoading, "GET");
    if (!user.success) {
      errorToast("Error Occured");
      return;
    }
    setitemlength({
      total: user.total ?? 0,
      totalpage: user.totalpage ?? 0,
    });
    setalldata((prev) => ({ ...prev, user: user.data }));
  };
  return (
    <div className="usermanagement_container relative w-full h-fit min-h-[80vh]">
      <header className="usermanagement_heade w-[500px] h-fit p-3 flex flex-row gap-x-5">
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
          onClick={() =>
            setopenmodal((prev) => ({ ...prev, filteroption: true }))
          }
          width="100%"
        />
        <PrimaryButton
          radius="10px"
          type="button"
          text={`Total: ${itemlength.total}`}
          width="100%"
        />
      </header>
      <div className="userlist w-full h-full grid grid-cols-3 gap-x-10 gap-y-10 place-items-center mt-5">
        {isLoading.GET && <LoadingText />}
        {allData.user.map((i, idx) => (
          <UserCard
            index={idx}
            firstname={i.firstname}
            lastname={i.lastname ?? ""}
            email={i.email}
            uid={i.id ?? 0}
          />
        ))}
      </div>
      <PaginationComponent
        page={page}
        show={showperpage}
        setshow={setshow}
        setpage={setpage}
        type="usermanagement"
      />

      {openmodal.createUser && <Createusermodal />}
      {openmodal.filteroption && <FilterMenu type="usermanagement" />}
    </div>
  );
}
