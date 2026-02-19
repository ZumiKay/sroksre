"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../../component/Button";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "../../component/Loading";
import React, { useCallback, useEffect, useState, useMemo, memo } from "react";
import { FilterMenu } from "../../component/SideMenu";
import { Createusermodal } from "../../component/Modals/User";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationCustom from "../../component/Pagination_Component";
import { UserState } from "@/src/types/user.type";
import useCheckSession from "@/src/hooks/useCheckSession";

interface usermangementFilterType {
  search?: string;
  lt?: string;
  p?: string;
  sort?: string;
  role?: string;
}

interface UserType {
  id: number;
  firstname: string;
  lastname?: string;
  email: string;
  role: string;
  phonenumber?: string;
  createdAt: string;
}
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

  const {
    openmodal,
    setopenmodal,
    itemlength,
    setitemlength,
    setalldata,
    allData,
  } = useGlobalContext();

  const handleAdd = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  }, [setopenmodal]);
  const [page, setpage] = useState(parseInt(p ?? "1"));
  const [showperpage, setshow] = useState(lt ?? "10");
  const [isFilter, setisFilter] = useState(!!search);
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
    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;

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

      setalldata({ user: user.data });
    };
    await Delayloading(asyncfetch, setloading, 2000);
  }, [
    search,
    page,
    showperpage,
    setitemlength,
    setalldata,
    handleCheckSession,
  ]);

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
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
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
        const result = await ApiRequest(
          "/api/users",
          undefined,
          "DELETE",
          "JSON",
          { userIds: selectedUsers },
        );
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
  const usersList = useMemo(
    () => (allData?.user as UserState[]) || [],
    [allData?.user],
  );

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
        u.createdAt?.toLocaleDateString(),
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

  // Memoize toggle view mode handler
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  // Memoize statistics cards
  const statisticsCards = useMemo(
    () => [
      {
        icon: "fa-users",
        gradient: "from-blue-500 to-purple-600",
        label: "Total Users",
        value: stats.totalUsers,
      },
      {
        icon: "fa-user-shield",
        gradient: "from-green-500 to-emerald-600",
        label: "Admins",
        value: stats.adminUsers,
      },
      {
        icon: "fa-user",
        gradient: "from-orange-500 to-red-600",
        label: "Regular Users",
        value: stats.regularUsers,
      },
      {
        icon: "fa-user-plus",
        gradient: "from-pink-500 to-purple-600",
        label: "New This Month",
        value: stats.newThisMonth,
      },
    ],
    [stats],
  );

  return (
    <>
      <title>User Management | SrokSre</title>
      <div className="usermanagement_container relative w-full h-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        {loading && <ContainerLoading />}

        {/* Header Section */}
        <div className="w-full mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage and monitor all users in your system
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Toggle view mode"
              >
                <i
                  className={`fa-solid ${
                    viewMode === "grid" ? "fa-list" : "fa-grip"
                  } text-gray-700`}
                ></i>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statisticsCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-lg bg-linear-to-br ${card.gradient} flex items-center justify-center`}
                  >
                    <i
                      className={`fa-solid ${card.icon} text-white text-xl`}
                    ></i>
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sort || "newest"}
              onChange={(e) => handleSort(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all bg-white"
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
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all bg-white"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
              <option value="EDITOR">Editor</option>
            </select>
          </div>
        </div>

        {/* Action Buttons and Bulk Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              text="Add User"
              onClick={() => handleAdd()}
              color="#3B82F6"
              hoverColor="#2563EB"
              Icon={<i className="fa-solid fa-plus font-bold text-base"></i>}
              width="160px"
              radius="12px"
              textcolor="white"
            />
            <PrimaryButton
              type="button"
              text="Export Users"
              onClick={handleExportUsers}
              color="#10B981"
              hoverColor="#059669"
              Icon={<i className="fa-solid fa-download text-base"></i>}
              width="160px"
              radius="12px"
              textcolor="white"
            />
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-sm font-medium text-gray-700">
                {selectedUsers.length} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="">Select Action</option>
                <option value="delete">Delete</option>
                <option value="role">Change Role</option>
              </select>
              <button
                onClick={handleBulkAction}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
        {/* Bulk Selection Header */}
        {allData?.user && allData.user.length > 0 && (
          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUsers.length === allData.user.length}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({allData.user.length} users)
              </span>
            </label>
          </div>
        )}

        {/* User Cards Grid/List */}
        <div className="userlist w-full h-fit">
          {!allData || !allData.user || allData.user.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-xs border border-gray-200">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <i className="fa-solid fa-users text-gray-400 text-4xl"></i>
              </div>
              <p className="text-xl font-semibold text-gray-600 mb-2">
                No Users Found
              </p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or add a new user
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {allData?.user?.map((i, idx: number) => (
                <div key={i.id || idx} className="relative">
                  <label className="absolute top-3 left-3 z-10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(i.id || idx)}
                      onChange={() => handleSelectUser(i.id || idx)}
                      className="w-5 h-5 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

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
          <div className="w-full h-fit mt-12 flex justify-center">
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
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
      </div>

      {openmodal.createUser && (
        <Createusermodal
          setpage={setpage}
          onSuccess={() => {
            // Refetch data after successful create/update
            fetchdata();
          }}
        />
      )}
      {openmodal.filteroption && (
        <FilterMenu type="usermanagement" setisFilter={setisFilter} />
      )}
    </>
  );
}

// Enhanced User Card Component - Memoized for performance
const EnhancedUserCard = memo(
  ({
    uid,
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
    uid: string;
    firstname: string;
    lastname?: string;
    email: string;
    role: string;
    phonenumber?: string;
    createdAt?: Date;
    isSelected: boolean;
    viewMode: "grid" | "list";
  }) => {
    const { setopenmodal, setglobalindex } = useGlobalContext();
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for date formatting
    useEffect(() => {
      setIsMounted(true);
    }, []);

    const handleEdit = useCallback(() => {
      setglobalindex((prev) => ({ ...prev, useredit: index }));
      setopenmodal((prev) => ({ ...prev, createUser: true }));
    }, [index, setglobalindex, setopenmodal]);

    const getRoleColor = useMemo(
      () => (role: string) => {
        switch (role) {
          case "ADMIN":
            return "bg-red-100 text-red-700 border-red-200";
          case "EDITOR":
            return "bg-blue-100 text-blue-700 border-blue-200";
          case "USER":
          default:
            return "bg-green-100 text-green-700 border-green-200";
        }
      },
      [],
    );

    const getRoleIcon = useMemo(
      () => (role: string) => {
        switch (role) {
          case "ADMIN":
            return "fa-user-shield";
          case "EDITOR":
            return "fa-user-pen";
          case "USER":
          default:
            return "fa-user";
        }
      },
      [],
    );

    const roleColor = useMemo(() => getRoleColor(role), [role, getRoleColor]);
    const roleIcon = useMemo(() => getRoleIcon(role), [role, getRoleIcon]);
    const firstLetter = useMemo(
      () => firstname.charAt(0).toUpperCase(),
      [firstname],
    );
    const fullName = useMemo(
      () => `${firstname} ${lastname || ""}`,
      [firstname, lastname],
    );
    const formattedDate = useMemo(
      () => (isMounted && createdAt ? createdAt.toLocaleDateString() : ""),
      [createdAt, isMounted],
    );

    if (viewMode === "list") {
      return (
        <div
          onClick={handleEdit}
          className={`w-full bg-white rounded-xl border-2 p-4 pl-12 transition-all duration-200 cursor-pointer hover:shadow-lg ${
            isSelected
              ? "border-blue-500 shadow-md"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">
                  {firstLetter}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {fullName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${roleColor}`}
              >
                <i className={`fa-solid ${roleIcon} mr-1`}></i>
                {role}
              </span>
              {phonenumber && (
                <span className="text-sm text-gray-600 hidden lg:block">
                  <i className="fa-solid fa-phone mr-1"></i>
                  {phonenumber}
                </span>
              )}
              <span className="text-xs text-gray-400 hidden xl:block">
                {formattedDate}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="fa-solid fa-edit text-gray-600"></i>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={handleEdit}
        className={`bg-white rounded-xl border-2 p-6 pt-10 transition-all duration-200 cursor-pointer hover:shadow-lg ${
          isSelected
            ? "border-blue-500 shadow-md"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">{firstLetter}</span>
          </div>
          <div className="text-center w-full">
            <h3 className="text-lg font-bold text-gray-800 truncate mb-1">
              {fullName}
            </h3>
            <p className="text-sm text-gray-500 truncate mb-2">{email}</p>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${roleColor}`}
            >
              <i className={`fa-solid ${roleIcon} mr-1`}></i>
              {role}
            </span>
          </div>
          {phonenumber && (
            <div className="w-full pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600 text-center">
                <i className="fa-solid fa-phone mr-1"></i>
                {phonenumber}
              </p>
            </div>
          )}
          <div className="w-full flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{formattedDate}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="fa-solid fa-edit text-gray-600"></i>
            </button>
          </div>
        </div>
      </div>
    );
  },
);

EnhancedUserCard.displayName = "EnhancedUserCard";
