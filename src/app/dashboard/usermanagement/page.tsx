"use client";
import { useGlobalStore } from "@/src/context/GlobalContext";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { ContainerLoading, errorToast, successToast } from "../../component/Loading";
import { useCallback, useEffect, useState, useMemo, memo } from "react";
import { FilterMenu } from "../../component/SideMenu";
import { Createusermodal } from "../../component/Modals/User";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationCustom from "../../component/Pagination_Component";
import { UserState } from "@/src/types/user.type";
import useCheckSession from "@/src/hooks/useCheckSession";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faDownload,
  faUsers,
  faPhone,
  faEdit,
  faList,
  faGrip,
  faUserShield,
  faUser,
  faUserPlus,
  faUserPen,
  faCheck,
  faXmark,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
export default function UsermanagementPage() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const { handleCheckSession } = useCheckSession();

  // Extract search params directly from hook
  const search = searchParam.get("search") ?? undefined;
  const p = searchParam.get("p") ?? undefined;
  const lt = searchParam.get("lt") ?? undefined;
  const sort = searchParam.get("sort") ?? undefined;
  const role = searchParam.get("role") ?? undefined;

  const openmodal = useGlobalStore((s) => s.openmodal);
  const setopenmodal = useGlobalStore((s) => s.setopenmodal);
  const itemlength = useGlobalStore((s) => s.itemlength);
  const setitemlength = useGlobalStore((s) => s.setitemlength);
  const setalldata = useGlobalStore((s) => s.setalldata);
  const allData = useGlobalStore((s) => s.allData);

  const handleAdd = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  }, [setopenmodal]);
  const [page, setpage] = useState(parseInt(p ?? "1"));
  const [showperpage, setshow] = useState(lt ?? "10");
  const [loading, setloading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState(search ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    newThisMonth: 0,
  });

  // Optimize useEffect to only call fetchdata when necessary
  useEffect(() => {
    fetchdata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showperpage, search, role, sort]);

  const calculateStats = useCallback(() => {
    if (allData?.user) {
      const users = allData.user as UserState[];
      const admins = users.filter((u) => u.role === "ADMIN").length;
      const currentMonth = new Date().getMonth();
      const newUsers = users.filter((u) => {
        const userMonth = new Date(u.createdAt as never).getMonth();
        return userMonth === currentMonth;
      }).length;

      setStats({
        totalUsers: itemlength.total,
        adminUsers: admins,
        regularUsers: users.length - admins,
        newThisMonth: newUsers,
      });
    }
  }, [allData?.user, itemlength.total]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Cleanup selected users when component unmounts or data changes
  useEffect(() => {
    return () => {
      setSelectedUsers([]);
    };
  }, []);

  const fetchdata = useCallback(async () => {
    const asyncfetch = async () => {
      const params = new URLSearchParams();
      params.set("p", `${page ?? 1}`);
      params.set("lt", `${showperpage}`);
      if (search) {
        params.set("search", search);
      }
      if (role) {
        params.set("role", role);
      }
      if (sort) {
        params.set("sort", sort);
      }

      const URL = `/api/users?${params.toString()}`;
      const user = await ApiRequest(URL, undefined, "GET");
      if (!user.success) {
        errorToast("Error Occured");
        return;
      }
      setitemlength({
        total: user.total ?? 0,
        totalpage: user.totalpage ?? 0,
      });

      setalldata({ user: user.data });
    };
    await Delayloading(asyncfetch, setloading, 150);
  }, [search, page, showperpage, role, sort, setitemlength, setalldata, handleCheckSession]);

  const handleSelectShow = useCallback(
    (value: string) => {
      const param = new URLSearchParams(searchParam);
      param.set("lt", value);

      router.push(`?${param}`);
      router.refresh();
    },
    [searchParam, router],
  );

  const handleSearch = useCallback(() => {
    const param = new URLSearchParams(searchParam);
    if (searchTerm) {
      param.set("search", searchTerm);
      param.set("p", "1");
    } else {
      param.delete("search");
    }
    router.push(`?${param}`);
    router.refresh();
  }, [searchParam, searchTerm, router]);

  const handleSort = useCallback(
    (sortValue: string) => {
      const param = new URLSearchParams(searchParam);
      param.set("sort", sortValue);
      param.set("p", "1");
      router.push(`?${param}`);
      router.refresh();
    },
    [searchParam, router],
  );

  const handleRoleFilter = useCallback(
    (roleValue: string) => {
      const param = new URLSearchParams(searchParam);
      if (roleValue === "all") {
        param.delete("role");
      } else {
        param.set("role", roleValue);
      }
      param.set("p", "1");
      router.push(`?${param}`);
      router.refresh();
    },
    [searchParam, router],
  );

  const handleSelectUser = useCallback((userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === allData?.user?.length) {
      setSelectedUsers([]);
    } else {
      const allIds = allData?.user?.map((u) => u.id) || [];
      setSelectedUsers(allIds.filter((i) => i) as number[]);
    }
  }, [selectedUsers.length, allData?.user]);

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      errorToast("Please select users and action");
      return;
    }

    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;

    setloading(true);
    try {
      if (bulkAction === "delete") {
        const result = await ApiRequest("/api/users", undefined, "DELETE", "JSON", {
          userIds: selectedUsers,
        });
        if (result.success) {
          successToast("Users deleted successfully");
          setSelectedUsers([]);
          fetchdata();
        } else {
          errorToast(result.message ?? "Failed to delete users");
        }
      } else if (bulkAction === "role") {
        // Handle role change
        successToast("Role update feature coming soon");
      }
    } catch (error) {
      errorToast("An error occurred");
    }
    setloading(false);
    setBulkAction("");
  }, [bulkAction, selectedUsers, fetchdata]);

  // Memoize users list to avoid recalculating on every render
  const usersList = useMemo(() => (allData?.user as UserState[]) || [], [allData?.user]);

  const handleExportUsers = useCallback(() => {
    if (!usersList || usersList.length === 0) {
      errorToast("No users to export");
      return;
    }

    const users = usersList;
    const csvContent = [
      ["ID", "Name", "Email", "Role", "Phone", "Created At"],
      ...users.map((u) => [
        u.id,
        `${u.firstname} ${u.lastname || ""}`,
        u.email,
        u.role,
        u.phonenumber || "N/A",
        u.createdAt?.toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url); // Clean up memory
    successToast("Users exported successfully");
  }, [usersList]);

  // Memoize statistics cards
  const statisticsCards = useMemo(
    () => [
      {
        icon: faUsers,
        color: "slate-600",
        textColor: "text-blue-600",
        label: "Total Users",
        value: stats.totalUsers,
      },
      {
        icon: faUserShield,
        color: "red-500",
        textColor: "text-red-600",
        label: "Admins",
        value: stats.adminUsers,
      },
      {
        icon: faUser,
        color: "green-500",
        textColor: "text-emerald-600",
        label: "Regular Users",
        value: stats.regularUsers,
      },
      {
        icon: faUserPlus,
        color: "orange-500",
        textColor: "text-amber-600",
        label: "New This Month",
        value: stats.newThisMonth,
      },
    ],
    [stats],
  );

  return (
    <>
      <title>User Management | SrokSre</title>
      <main className="usermanagement_container relative w-full min-h-screen bg-gray-50 p-5 md:p-8">
        {loading && <ContainerLoading />}

        {/* Header Section */}
        <div className="w-full mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Dashboard / Users
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and monitor all users in your system
              </p>
            </div>
            <div className="flex items-center gap-1 self-start md:self-auto bg-white rounded-xl shadow-xs border border-gray-100 p-1">
              {(
                [
                  { mode: "grid", icon: faGrip, title: "Grid view" },
                  { mode: "list", icon: faList, title: "List view" },
                ] as const
              ).map(({ mode, icon, title }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  title={title}
                  aria-pressed={viewMode === mode}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    viewMode === mode ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            {statisticsCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-${card.color}  flex items-center justify-center mb-3 shadow-sm`}
                >
                  <FontAwesomeIcon icon={card.icon} className="text-white text-base" />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                  {card.label}
                </p>
                <p className={`text-2xl font-extrabold ${card.textColor}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search, Filter and Actions */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 mb-6">
          <div className="w-full flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 flex gap-2">
              <div className="flex-1 flex items-center gap-2 h-10 bg-white border border-gray-200 rounded-lg px-3 transition-colors hover:border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-200">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="shrink-0 h-10 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Dropdown */}
              <select
                value={sort || "newest"}
                onChange={(e) => handleSort(e.target.value)}
                className="h-10 px-3 text-sm text-gray-700 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>

              {/* Role Filter */}
              <select
                value={role || "all"}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="h-10 px-3 text-sm text-gray-700 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
                <option value="EDITOR">Editor</option>
              </select>

              {/* Divider */}
              <div className="hidden md:block h-10 w-px bg-gray-200 mx-1" />

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] bg-slate-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Add User
              </button>
              <button
                type="button"
                onClick={handleExportUsers}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] bg-linear-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-sm font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 shadow-sm">
            <span className="text-sm font-semibold text-indigo-700">
              {selectedUsers.length} selected
            </span>
            <div className="h-4 w-px bg-indigo-200 shrink-0" />
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="h-9 px-3 text-sm border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select action…</option>
              <option value="delete">Delete</option>
              <option value="role">Change Role</option>
            </select>
            <button
              type="button"
              disabled={!bulkAction}
              onClick={handleBulkAction}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setSelectedUsers([])}
              className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-indigo-200 hover:bg-indigo-100 text-indigo-600 text-sm font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
              Clear
            </button>
          </div>
        )}

        {/* Select-all row */}
        {allData?.user && allData.user.length > 0 && (
          <div className="flex items-center gap-2 px-1 pb-3">
            <SelectBox
              checked={selectedUsers.length === allData.user.length}
              onToggle={handleSelectAll}
              label="Select all users"
            />
            <span
              onClick={handleSelectAll}
              className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-700"
            >
              {selectedUsers.length > 0
                ? `${selectedUsers.length} / ${allData.user.length} selected`
                : `Select all (${allData.user.length} users)`}
            </span>
          </div>
        )}

        {/* User Cards */}
        <div className="userlist w-full h-fit">
          {!allData || !allData.user || allData.user.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-24 bg-white rounded-2xl shadow-xs border border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-2xl" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-500">No users found</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Try adjusting your filters or add a new user
                </p>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {allData?.user?.map((i, idx: number) => (
                <div key={i.id || idx} className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <SelectBox
                      checked={selectedUsers.includes(i.id || idx)}
                      onToggle={() => handleSelectUser(i.id || idx)}
                      label={`Select ${i.firstname}`}
                    />
                  </div>

                  <EnhancedUserCard
                    index={idx}
                    firstname={i.firstname}
                    lastname={i.lastname ?? ""}
                    email={i.email}
                    uid={i.id?.toString() ?? "0"}
                    role={i.role as string}
                    phonenumber={i.phonenumber}
                    createdAt={i.createdAt ? new Date(i.createdAt) : undefined}
                    isSelected={selectedUsers.includes(i.id || idx)}
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {itemlength.totalpage ? (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1">
            <p className="text-xs text-gray-400 font-medium">
              Page <span className="font-semibold text-gray-600">{page}</span> of{" "}
              <span className="font-semibold text-gray-600">{itemlength.totalpage}</span>
            </p>
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 px-4 py-2">
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
          </div>
        ) : (
          ""
        )}
      </main>

      {openmodal.createUser && (
        <Createusermodal
          setpage={setpage}
          onSuccess={() => {
            // Refetch data after successful create/update
            fetchdata();
          }}
        />
      )}
      {openmodal.filteroption && <FilterMenu type="usermanagement" />}
    </>
  );
}

// Checkbox styled like the order management page
function SelectBox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
        checked
          ? "bg-indigo-600 border-indigo-600"
          : "bg-white border-gray-300 hover:border-indigo-400"
      }`}
    >
      {checked && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
    </button>
  );
}

// Enhanced User Card Component - Memoized for performance
const EnhancedUserCard = memo(
  ({
    firstname,
    lastname,
    email,
    role,
    phonenumber,
    createdAt,
    index,
    isSelected,
    viewMode,
  }: {
    index: number;
    firstname: string;
    lastname?: string;
    email: string;
    role: string;
    phonenumber?: string;
    createdAt?: Date;
    isSelected: boolean;
    viewMode: "grid" | "list";
  }) => {
    const setopenmodal = useGlobalStore((s) => s.setopenmodal);
    const setglobalindex = useGlobalStore((s) => s.setglobalindex);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for date formatting
    useEffect(() => {
      setIsMounted(true);
    }, []);

    const handleEdit = useCallback(() => {
      setglobalindex((prev) => ({ ...prev, useredit: index }));
      setopenmodal((prev) => ({ ...prev, createUser: true }));
    }, [index, setglobalindex, setopenmodal]);

    const roleColor = ROLE_STYLES[role]?.color ?? ROLE_STYLES.USER.color;
    const roleIcon = ROLE_STYLES[role]?.icon ?? ROLE_STYLES.USER.icon;
    const firstLetter = useMemo(() => firstname.charAt(0).toUpperCase(), [firstname]);
    const fullName = useMemo(() => `${firstname} ${lastname || ""}`, [firstname, lastname]);
    const formattedDate = useMemo(
      () => (isMounted && createdAt ? createdAt.toLocaleDateString() : ""),
      [createdAt, isMounted],
    );

    const cardState = isSelected
      ? "border-indigo-300 ring-2 ring-indigo-500/30 shadow-md"
      : "border-gray-100 hover:shadow-md hover:-translate-y-0.5";

    const roleBadge = (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColor}`}
      >
        <FontAwesomeIcon icon={roleIcon} className="text-[10px]" />
        {role}
      </span>
    );

    const editButton = (
      <button
        type="button"
        aria-label={`Edit ${fullName}`}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit();
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <FontAwesomeIcon icon={faEdit} className="text-sm" />
      </button>
    );

    if (viewMode === "list") {
      return (
        <div
          onClick={handleEdit}
          className={`w-full bg-white rounded-2xl border shadow-xs px-4 py-3 pl-12 transition-all duration-200 cursor-pointer ${cardState}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-bold text-base">{firstLetter}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h3>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {roleBadge}
              {phonenumber && (
                <span className="text-xs text-gray-500 hidden lg:block">
                  <FontAwesomeIcon icon={faPhone} className="mr-1.5 text-gray-400" />
                  {phonenumber}
                </span>
              )}
              <span className="text-xs text-gray-400 hidden xl:block">{formattedDate}</span>
              {editButton}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={handleEdit}
        className={`bg-white rounded-2xl border shadow-xs p-5 pt-10 transition-all duration-200 cursor-pointer ${cardState}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-2xl">{firstLetter}</span>
          </div>
          <div className="text-center w-full">
            <h3 className="text-base font-semibold text-gray-900 truncate mb-0.5">{fullName}</h3>
            <p className="text-xs text-gray-500 truncate mb-2.5">{email}</p>
            {roleBadge}
          </div>
          {phonenumber && (
            <div className="w-full pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                <FontAwesomeIcon icon={faPhone} className="mr-1.5 text-gray-400" />
                {phonenumber}
              </p>
            </div>
          )}
          <div className="w-full flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{formattedDate}</span>
            {editButton}
          </div>
        </div>
      </div>
    );
  },
);

EnhancedUserCard.displayName = "EnhancedUserCard";

const ROLE_STYLES: Record<string, { color: string; icon: IconDefinition }> = {
  ADMIN: {
    color: "bg-red-50 text-red-700 border-red-100",
    icon: faUserShield,
  },
  EDITOR: {
    color: "bg-blue-50 text-blue-700 border-blue-100",
    icon: faUserPen,
  },
  USER: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: faUser,
  },
};
