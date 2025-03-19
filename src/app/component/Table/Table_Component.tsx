import {
  Accordion,
  AccordionItem,
  Button,
  Selection,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  InventoryType,
  StockType,
} from "../../dashboard/inventory/inventory.type";
import { Key, useCallback, useEffect, useMemo, useState } from "react";
import {
  BannerState,
  ProductState,
  PromotionState,
} from "@/src/context/GlobalType.type";
import { ActionContainer } from "./Component";

interface TableComponentProps {
  ty: InventoryType;
  data: Array<ProductState | BannerState | PromotionState>;
  onAction?: (key: string) => void;
  isLoading?: boolean;
  onSelection?: (key: Array<number>) => void;
  onPagination: (ty: "page" | "limit") => void;
}

type ColumnType = {
  name: string;
  uid: string;
  view?: boolean;
};

const ProductColumns: Array<ColumnType> = [
  {
    name: "Id",
    uid: "id",
  },
  { name: "Name", uid: "name" },
  {
    name: "Price",
    uid: "price",
  },
  {
    name: "Category",
    uid: "category",
  },
  {
    name: "Stock",
    uid: "stock",
  },
  {
    name: "Action",
    uid: "action",
  },
];

const BannerColumns: Array<ColumnType> = [
  {
    name: "Id",
    uid: "id",
  },
  {
    name: "Name",
    uid: "name",
  },
  {
    name: "Size",
    uid: "size",
  },
  {
    name: "Link",
    uid: "linktype",
  },
  {
    name: "Action",
    uid: "action",
  },
];

const PromotionColumns: Array<ColumnType> = [
  {
    name: "Id",
    uid: "id",
  },
  {
    name: "Name",
    uid: "name",
  },
  { name: "Banner", uid: "banner" },
  {
    name: "Product",
    uid: "Products",
  },

  { name: "Expire", uid: "expireAt" },
  {
    name: "Action",
    uid: "action",
  },
];

export default function TableComponent({
  ty,
  data,
  onAction,
  isLoading,
  onSelection,
}: TableComponentProps) {
  const [selectedData, setselectedData] = useState<Selection>(new Set([]));
  const renderColumn = useCallback(() => {
    return ty === InventoryType.Product
      ? ProductColumns
      : ty === InventoryType.Banner
      ? BannerColumns
      : PromotionColumns;
  }, [ty]);

  useEffect(() => {
    onSelection && onSelection(Array.from(selectedData) as number[]);
  }, [selectedData]);

  const memoizedTy = useMemo(() => ty, [ty]);

  const handleClick = useCallback(() => {
    alert("Open Detail with photo and title");
  }, []);

  const handleView = useCallback((uid: string) => {
    alert("Show Detai View");
  }, []);

  const handleAction = useCallback(
    (key: Key) => {
      onAction?.(key.toString());
    },
    [onAction]
  );

  const renderCell = useCallback(
    (key: Key, celldata: Record<string, any>) => {
      if (!celldata) return null;

      switch (key) {
        case "name":
          return memoizedTy === InventoryType.Product ? (
            <div
              className="name w-full h-fit hover:text-gray-300 active:text-gray-300"
              onClick={handleClick}
            >
              {celldata.name}
            </div>
          ) : (
            celldata[key]
          );

        case "price": {
          const { discount, price, id } = celldata as ProductState;
          return discount ? (
            <div className="price_container w-full h-fit">
              <Accordion>
                <AccordionItem
                  key={`price${id}`}
                  title={`$${discount.newprice}`}
                >
                  <div className="listdownprice w-full h-fit flex flex-col items-center">
                    <p>{`Discount: %${discount.percent}`}</p>
                    <p>{`Original: $${price.toFixed(2)}`}</p>
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            celldata[key]
          );
        }

        case "category":
          const { category } = celldata as ProductState;
          return (
            <div className="category_container w-full h-fit inline-flex gap-x-3">
              <p>{category.parent.name}</p>
              <span>{` / `}</span>
              <p>{category.child.name}</p>
            </div>
          );

        case "stock":
          const { stocktype } = celldata as ProductState;
          return stocktype === StockType.Stock ? (
            celldata[key]
          ) : (
            <Button
              onPress={() => handleView(key)}
              variant="solid"
              color="primary"
              className="font-bold"
            >
              VIEW
            </Button>
          );
        case "Products":
        case "banner":
          return (
            <Button
              onPress={() => handleView(key)}
              variant="solid"
              color="primary"
              className="font-bold"
            >
              VIEW
            </Button>
          );

        case "action":
          return <ActionContainer onAction={handleAction} />;

        default:
          return celldata[key.toString()];
      }
    },
    [memoizedTy, handleClick, handleAction, handleView]
  );
  return (
    <div className="table_container w-full h-fit">
      <Table
        isHeaderSticky
        selectedKeys={selectedData}
        onSelectionChange={setselectedData}
        aria-label="table container for product promotion and banner"
      >
        <TableHeader columns={renderColumn()}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "action" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner label="loading..." />}
          items={data}
          emptyContent={"No Items"}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell key={columnKey}>
                  {renderCell(columnKey, item)}{" "}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
