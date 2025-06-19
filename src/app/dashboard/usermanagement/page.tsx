"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { ContainerLoading, errorToast } from "../../component/Loading";
import { useCallback, useEffect, useState, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TableComponent from "../../component/Table/Table_Component";
import FilterMenu from "../../component/FilterMenu/FilterMenu";
import { UserDetailModel } from "./component";

interface usermangementFilterType {
  search?: string;
  lt?: string;
  p?: string;
}

export default function UsermanagementPage(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  // Extract data from context and params
  const searchParams = use(props.searchParams as never);
  const {
    itemlength,
    setitemlength,
    setalldata,
    allData,
    setopenmodal,
    filtervalue,
    setfiltervalue,
    openmodal,
  } = useGlobalContext();
  const { search, p, lt } = searchParams as usermangementFilterType;

  // Local state
  const [page, setpage] = useState(() => parseInt(p ?? "1"));
  const [showperpage, setshow] = useState(() => lt ?? "1");
  const [loading, setloading] = useState(false);

  // Hooks
  const router = useRouter();
  const searchParam = useSearchParams();

  // Create the API URL once when dependencies change
  const apiURL = useMemo(() => {
    return `/api/users?${search ? `ty=filter&search=${search}` : `ty=all`}&p=${
      page ?? 1
    }&lt=${showperpage}`;
  }, [search, page, showperpage]);

  // Data fetching function
  const fetchdata = useCallback(async () => {
    const fetchUsers = async () => {
      try {
        const user = await ApiRequest({ url: apiURL, method: "GET" });

        if (!user.success) {
          errorToast("Error Occurred");
          return;
        }

        setitemlength({
          total: user.total ?? 0,
          totalpage: user.totalPages ?? 0,
        });

        setalldata({ user: user.data as never });
      } catch (error) {
        console.log("Fetch AllUser", error);
        errorToast("Failed to fetch users");
      }
    };

    await Delayloading(fetchUsers, setloading, 2000);
  }, [apiURL, setalldata, setitemlength]);

  // Initialize filter value and fetch data
  useEffect(() => {
    setfiltervalue({ search });
    fetchdata();
  }, [search, fetchdata, setfiltervalue]);

  // Handle pagination
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

  const isFilter = useMemo(() => {
    return filtervalue && Object.values(filtervalue).some((i) => i);
  }, [filtervalue]);

  // Memoize buttons section to prevent unnecessary re-renders
  const actionButtons = useMemo(
    () => (
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
          text={isFilter ? "Filtered" : "Filter"}
          width="150px"
          style={isFilter ? { backgroundColor: "gray" } : {}}
          onClick={() => setopenmodal({ filteroption: true })}
        />
      </div>
    ),
    [isFilter, itemlength.total, router, setopenmodal]
  );

  // Memoize table to prevent unnecessary re-renders
  const userTable = useMemo(
    () => (
      <TableComponent
        ty="usermanagement"
        data={allData?.user ?? []}
        pagination={{
          itemscount: itemlength.total ?? 0,
          show: showperpage,
          page: page,
          setpage,
          onShowPage: setshow,
        }}
        onPagination={handlePagination}
      />
    ),
    [allData?.user, handlePagination, itemlength.total, page, showperpage]
  );

  return (
    <>
      <title>User Management | SrokSre</title>
      {openmodal.filteroption && (
        <FilterMenu
          type="usermanagement"
          isLoading={loading}
          reloaddata={fetchdata}
        />
      )}
      {openmodal.userdetail && <UserDetailModel />}

      <div className="usermanagement_container relative w-full h-fit">
        {loading && <ContainerLoading />}
        <div className="w-full h-fit overflow-x-auto">{actionButtons}</div>
        <section className="w-full h-full max-defaultsize:overflow-x-auto overflow-hidden">
          {userTable}
        </section>
      </div>
    </>
  );
}
