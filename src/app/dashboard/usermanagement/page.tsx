"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { UserCard } from "../../component/Card";

import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import {
  ContainerLoading,
  LoadingText,
  errorToast,
} from "../../component/Loading";
import { ChangeEvent, useEffect, useState } from "react";
import PaginationComponent from "../../component/Pagination";
import { FilterMenu } from "../../component/SideMenu";
import { Createusermodal } from "../../component/Modals/User";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationCustom from "../../component/Pagination_Component";

interface usermangementFilterType {
  search?: string;

  lt?: string;
  p?: string;
}
export default function UsermanagementPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const {
    openmodal,
    setopenmodal,
    itemlength,
    setitemlength,
    setalldata,
    allData,
  } = useGlobalContext();
  const { search, p, lt } = searchParams as usermangementFilterType;
  const handleAdd = () => {
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  };
  const [page, setpage] = useState(parseInt(p ?? "1"));
  const [showperpage, setshow] = useState(lt ?? "1");
  const [isFilter, setisFilter] = useState(!!search);
  const [loading, setloading] = useState(false);
  const router = useRouter();
  const searchParam = useSearchParams();

  useEffect(() => {
    fetchdata();
  }, [page, showperpage, searchParams]);
  const fetchdata = async () => {
    const asyncfetch = async () => {
      const URL = `/api/users?${search ? `ty=filter` : `ty=all`}${
        search ? `&search=${search}` : ""
      }${`&p=${page ?? 1}`}${`&lt=${showperpage}`}`;
      const user = await ApiRequest(URL, undefined, "GET");
      if (!user.success) {
        errorToast("Error Occured");
        return;
      }
      setitemlength({
        total: user.total ?? 0,
        totalpage: user.totalpage ?? 0,
      });
      console.log({ user });

      setalldata({ user: user.data });
    };
    await Delayloading(asyncfetch, setloading, 2000);
  };

  const handleSelectShow = (value: string) => {
    const param = new URLSearchParams(searchParam);
    param.set("lt", value);

    router.push(`?${param}`);
    router.refresh();
  };
  return (
    <div className="usermanagement_container relative w-full h-fit">
      {loading && <ContainerLoading />}
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
          text={isFilter ? "Clear Filter" : "Filter"}
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
      <div className="userlist w-full h-fit min-h-[70vh] grid grid-cols-3 gap-x-10 gap-y-10 place-content-start place-items-center mt-5">
        {allData.user?.map((i, idx) => (
          <UserCard
            index={idx}
            firstname={i.firstname}
            lastname={i.lastname ?? ""}
            email={i.email}
            uid={i.id?.toString() ?? "0"}
          />
        ))}
      </div>

      <div className="w-full h-fit mt-16">
        <PaginationCustom
          count={itemlength.totalpage}
          page={page}
          show={showperpage}
          setshow={setshow}
          setpage={setpage}
          onSelectShowPerPage={(value) => {
            handleSelectShow(value.toString());
          }}
        />
      </div>

      {openmodal.createUser && <Createusermodal />}
      {openmodal.filteroption && (
        <FilterMenu
          type="usermanagement"
          setisFilter={setisFilter}
          param={searchParams}
        />
      )}
    </div>
  );
}
