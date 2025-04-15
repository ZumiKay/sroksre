"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { ContainerLoading, errorToast } from "../../component/Loading";
import { useCallback, useEffect, useState, use } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { IsNumber } from "@/src/lib/utilities";
import TableComponent from "../../component/Table/Table_Component";
import FilterMenu from "../../component/FilterMenu/FilterMenu";

interface usermangementFilterType {
  search?: string;
  lt?: string;
  p?: string;
}

export default function UsermanagementPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | undefined }>;
  }
) {
  const searchParams = use(props.searchParams);
  const {
    itemlength,
    setitemlength,
    setalldata,
    allData,
    setopenmodal,
    openmodal,
  } = useGlobalContext();
  const { search, p, lt } = searchParams as usermangementFilterType;
  const [page, setpage] = useState(parseInt(p ?? "1"));
  const [showperpage, setshow] = useState(lt ?? "1");
  const [loading, setloading] = useState(false);
  const router = useRouter();
  const searchParam = useSearchParams();

  const fetchdata = useCallback(async () => {
    const asyncfetch = async () => {
      const URL = `/api/users?${search ? `ty=filter` : `ty=all`}${
        search ? `&search=${search}` : ""
      }${`&p=${page ?? 1}`}${`&lt=${showperpage}`}`;
      const user = await ApiRequest({ url: URL, method: "GET" });
      if (!user.success) {
        errorToast("Error Occured");
        return;
      }
      setitemlength({
        total: user.total ?? 0,
        totalpage: user.totalpage ?? 0,
      });

      setalldata({ user: user.data as never });
    };
    await Delayloading(asyncfetch, setloading, 2000);
  }, [page, search, setalldata, setitemlength, showperpage]);

  useEffect(() => {
    fetchdata();
  }, [page, showperpage, search]);

  const handlePagination = useCallback(
    (ty: "page" | "limit", val: string) => {
      const param = new URLSearchParams(searchParam);
      if (ty === "page") {
        param.set("p", val);
      } else {
        param.set("p", "1");
        param.set("lt", val);
        setpage(1);
      }

      router.push(`?${param}`);
    },
    [router, searchParam]
  );
  return (
    <>
      <title>User Management | SrokSre</title>
      {openmodal.filteroption && <FilterMenu type="usermanagement" />}

      <div className="usermanagement_container relative w-full h-fit">
        {loading && <ContainerLoading />}
        <div className="w-full h-fit overflow-x-auto">
          <div className="usermanagement_heade w-[500px] h-fit p-3 flex flex-row gap-x-5">
            <PrimaryButton
              type="button"
              text="Add"
              onClick={() => router.push(`/dashboard/usermanagement/0`)}
              color="#0097FA"
              Icon={<i className="fa-solid fa-plus font-bold text-lg"></i>}
              width="150px"
              radius="10px"
            />
            <PrimaryButton
              radius="10px"
              type="button"
              text={`Total: ${itemlength.total}`}
              width="150px"
            />
            <PrimaryButton
              radius="10px"
              type="button"
              text={`Total: ${itemlength.total}`}
              width="150px"
              color="Filter"
              onClick={() => setopenmodal({ filteroption: true })}
            />
          </div>
        </div>
        <section className="w-full h-full max-defaultsize:overflow-x-auto overflow-hidden">
          <TableComponent
            ty="usermanagement"
            data={allData?.user ?? []}
            pagination={{
              itemscount: itemlength.total,
              show: showperpage,
              page: page,
              setpage,
              onShowPage: setshow,
            }}
            onPagination={handlePagination}
          />
        </section>
      </div>
    </>
  );
}
