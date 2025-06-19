"use client";
import { memo, useEffect, useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Divider,
} from "@heroui/react";
import { ApiRequest } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { UserState } from "@/src/context/GlobalType.type";
import { Address } from "@prisma/client";
import { errorToast } from "../../component/Loading";

// Types for better type safety
interface DetailTableProps {
  ty: "user" | "shipping";
}

interface TableRowData {
  key: string;
  field: string;
  value: string | number | Date | null;
}

// Utility function to format field names
const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ");
};

// Utility function to format values
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "string" && value.trim() === "") return "N/A";
  return String(value);
};

export const DetailTable = memo<DetailTableProps>(({ ty }) => {
  const { globalindex } = useGlobalContext();
  const [displayData, setDisplayData] = useState<
    Address | UserState | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data effect
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!globalindex.orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const url = `/api/order/list?ty=${ty}&id=${globalindex.orderId}`;
        const getData = await ApiRequest({ url, method: "GET" });

        if (!isMounted) return;

        if (getData.success && getData.data) {
          setDisplayData(getData.data as Address | UserState);
        } else {
          throw new Error(getData.message || "Failed to fetch data");
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage =
            error instanceof Error ? error.message : "Can't Get Data";
          setError(errorMessage);
          errorToast(errorMessage);
          console.error("Error fetching data:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [globalindex.orderId, ty]);

  // Memoized table data
  const tableData = useMemo(() => {
    if (!displayData) return [];

    if (ty === "user") {
      const userData = displayData as UserState;
      return [
        { key: "email", field: "Email", value: userData.email },
        { key: "username", field: "Username", value: userData.username },
        { key: "firstname", field: "First Name", value: userData.firstname },
        { key: "lastname", field: "Last Name", value: userData.lastname },
        { key: "phone", field: "Phone", value: userData.phonenumber },
        { key: "role", field: "Role", value: userData.role },
        { key: "isActive", field: "Active Status", value: userData.isVerified },
        { key: "createdAt", field: "Member Since", value: userData.createdAt },
      ].filter((item) => item.value !== undefined);
    } else {
      const addressData = displayData as Address;
      return [
        { key: "address", field: "Street Address", value: addressData.street },
        { key: "sangkat", field: "Sangkat", value: addressData.songkhat },
        { key: "khan", field: "Khan/District", value: addressData.district },
        {
          key: "state",
          field: "State/Province/City",
          value: addressData.province,
        },
        {
          key: "postalCode",
          field: "Postal Code",
          value: addressData.postalcode,
        },
        {
          key: "name",
          field: "Name",
          value: addressData.firstname + " " + addressData.lastname,
        },
      ].filter((item) => item.value !== undefined);
    }
  }, [displayData, ty]);

  // Render value with appropriate styling
  const renderValue = (item: TableRowData) => {
    const { key, value } = item;

    if (key === "role") {
      return (
        <Chip
          color={value === "ADMIN" ? "primary" : "default"}
          variant="flat"
          size="sm"
        >
          {formatValue(value)}
        </Chip>
      );
    }

    if (key === "isActive" || key === "isDefault") {
      return (
        <Chip color={value ? "success" : "warning"} variant="flat" size="sm">
          {formatValue(value)}
        </Chip>
      );
    }

    if (key === "createdAt" && value instanceof Date) {
      return (
        <span className="text-default-600">
          {value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      );
    }

    return (
      <span className={value ? "text-default-900" : "text-default-400"}>
        {formatValue(value)}
      </span>
    );
  };

  // Get card title
  const cardTitle = ty === "user" ? "Customer Information" : "Shipping Address";
  const cardIcon = ty === "user" ? "👤" : "🏠";

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="flex gap-3 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cardIcon}</span>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-default-900">{cardTitle}</h2>
            <p className="text-small text-default-500">
              Order ID: {globalindex.orderId}
            </p>
          </div>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="px-6 py-4">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" label="Loading details..." color="primary" />
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-danger font-medium">{error}</p>
              <p className="text-default-500 text-sm mt-1">
                Please try refreshing the page
              </p>
            </div>
          </div>
        )}

        {!loading && !error && tableData.length > 0 && (
          <Table
            aria-label={`${cardTitle} table`}
            className="min-h-[200px]"
            classNames={{
              wrapper: "shadow-none border border-divider rounded-lg",
              th: "bg-default-100 text-default-700 font-semibold",
              td: "py-3",
            }}
          >
            <TableHeader>
              <TableColumn className="w-1/3">FIELD</TableColumn>
              <TableColumn>VALUE</TableColumn>
            </TableHeader>
            <TableBody>
              {tableData.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <span className="font-medium text-default-700">
                      {item.field}
                    </span>
                  </TableCell>
                  <TableCell>{renderValue(item as never)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && !error && tableData.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-default-500 font-medium">No data available</p>
              <p className="text-default-400 text-sm mt-1">
                {ty === "user"
                  ? "Customer information not found"
                  : "Shipping address not found"}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
});

DetailTable.displayName = "DetailTable";

// Enhanced DetailWrapper component to show both tables
export const DetailWrapper = memo(() => {
  const { globalindex } = useGlobalContext();

  if (!globalindex.orderId) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-default-500 font-medium">No order selected</p>
          <p className="text-default-400 text-sm mt-1">
            Please select an order to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailTable ty="user" />
        <DetailTable ty="shipping" />
      </div>
    </div>
  );
});

DetailWrapper.displayName = "DetailWrapper";

export default DetailTable;
