import {
  Button,
  Selection,
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
  ActionState,
  BannerState,
  GlobalIndexState,
  ImageDatatype,
  InventoryPage,
  OpenModalState,
  ProductState,
  PromotionState,
  UserState,
} from "@/src/context/GlobalType.type";
import {
  ActionContainer,
  TableBottomContent,
  tableBottomContentProps,
  TopTableContent,
} from "./Component";
import { useGlobalContext } from "@/src/context/GlobalContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";

interface TableComponentProps {
  ty: InventoryPage;
  data?: Array<ProductState | BannerState | PromotionState | UserState>;
  onAction?: (key: string) => void;
  isLoading?: boolean;
  onSelection?: (key: Array<number>) => void;
  onPagination: (ty: "page" | "limit", val: string) => void;
  pagination: tableBottomContentProps;
  singleselect?: boolean;
  selectedvalue?: Array<number>;
}

type ColumnType = {
  name: string;
  uid: string;
  view?: boolean;
};

const UsermanagementColumns: Array<ColumnType> = [
  {
    name: "Id",
    uid: "id",
  },
  { name: "Name", uid: "name" },
  { name: "Email", uid: "email" },
  {
    name: "Role",
    uid: "role",
  },
  { name: "Other", uid: "other" },
  { name: "Action", uid: "action" },
];

const ProductColumns: Array<ColumnType> = [
  {
    name: "Id",
    uid: "id",
  },

  { name: "Cover", uid: "covers" },
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
  { name: "Image", uid: "image" },
  {
    name: "Name",
    uid: "name",
  },
  {
    name: "Size",
    uid: "size",
  },
  {
    name: "Link Type",
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

  { name: "Expire At", uid: "expireAt" },
  {
    name: "Action",
    uid: "action",
  },
];

interface Stock {
  type: string;
  value: number;
}

export default function TableComponent({
  ty,
  data,
  isLoading,
  onSelection,
  pagination,
  singleselect,
  selectedvalue,
}: TableComponentProps) {
  const { setopenmodal, setglobalindex, setproduct } = useGlobalContext();
  const [selectedData, setselectedData] = useState<Selection>(
    new Set(selectedvalue ?? [])
  );
  const Router = useRouter();
  const renderColumn = useCallback(() => {
    return ty === InventoryType.Product
      ? ProductColumns
      : ty === InventoryType.Banner
      ? BannerColumns
      : ty === "usermanagement"
      ? UsermanagementColumns
      : PromotionColumns;
  }, [ty]);

  useEffect(() => {
    if (onSelection) {
      const convertedToNumber = Array.from(selectedData).map((i) => Number(i));
      onSelection(convertedToNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedData]);

  const memoizedTy = useMemo(() => ty, [ty]);

  const handleClick = useCallback(() => {
    alert("Open Detail with photo and title");
  }, []);

  const handleView = useCallback(
    (uid: string, id: number) => {
      const toOpenModal: Partial<OpenModalState> = {};
      const toUpdateIndex: Partial<GlobalIndexState> = {};

      if (uid === "stock") {
        toOpenModal.editvariantstock = true;
        toUpdateIndex.producteditindex = id;
      } else if (uid === "Products") {
        toOpenModal["showproduct"] = true;
        toUpdateIndex.producteditindex = id;
      } else if (uid === "covers") {
        toOpenModal[`cover${id}`] = true;
        toUpdateIndex.producteditindex = id;
      } else if (uid === "other") {
        toOpenModal["other"] = true;
        toUpdateIndex.useredit = id;
      }

      setglobalindex((prev) => ({ ...prev, ...toUpdateIndex }));
      setopenmodal(toOpenModal);
    },
    [setglobalindex, setopenmodal]
  );

  const handleAction = useCallback(
    (key: ActionState, id: number, type: InventoryPage, stock?: Stock) => {
      if (!id) return;

      const modalState: Partial<OpenModalState> = {};
      const indexState: Partial<GlobalIndexState> = {};

      // Configuration for each type
      const config: Record<
        InventoryPage,
        { createKey: keyof OpenModalState; indexKey: keyof GlobalIndexState }
      > = {
        product: { createKey: "createProduct", indexKey: "producteditindex" },
        banner: { createKey: "createBanner", indexKey: "bannereditindex" },
        promotion: {
          createKey: "createPromotion",
          indexKey: "promotioneditindex",
        },
        usermanagement: {
          createKey: "createUser",
          indexKey: "useredit",
        },
      };

      const { createKey, indexKey } = config[type as InventoryPage];

      if (key === "edit") {
        if (createKey === "createProduct") {
          Router.push(`/dashboard/inventory/createproduct/${id}`);
        } else if (createKey === "createUser") {
          Router.push(`/dashboard/usermanagement/${id}`);
        } else modalState[createKey] = true;
        indexState[indexKey] = id as never;
      } else if (key === "delete") {
        modalState.confirmmodal = {
          index: id,
          type: type === "usermanagement" ? "user" : type,
          open: true,
        };
      } else if (type === "product" && stock) {
        modalState[`${stock.type}${id}`] = true;
        setproduct((prev) => ({ ...prev, id, stock: stock.value }));
      }

      setopenmodal((prev) => ({ ...prev, ...modalState } as never));
      setglobalindex((prev) => ({ ...prev, ...indexState }));
    },
    [Router, setglobalindex, setopenmodal, setproduct]
  );

  const renderCell = useCallback(
    (key: Key, celldata: { [x: string]: never }) => {
      if (!celldata) return null;

      switch (key) {
        case "image":
        case "covers":
        case "banner": {
          const data = celldata[key][0]
            ? celldata[key][0]
            : (celldata[key] as ImageDatatype);
          if (!data) return null;
          return (
            <Image
              className="w-[100px] h-[100px] object-cover rounded-sm"
              onClick={() => handleView(key, celldata.id)}
              width={100}
              height={100}
              loading="lazy"
              alt={`cover${data.url}`}
              src={data.url}
            />
          );
        }
        case "name":
          return memoizedTy === InventoryType.Product ? (
            <div
              className="name w-full h-fit hover:text-gray-300 active:text-gray-300"
              onClick={handleClick}
            >
              {celldata.name}
            </div>
          ) : memoizedTy === "usermanagement" ? (
            <div className="username">
              <p>{`Firstname: ${celldata.firstname}`}</p>
              {celldata?.lastname && <p>{`Lastname: ${celldata.lastname}`}</p>}
            </div>
          ) : (
            celldata[key]
          );

        case "price": {
          const { discount, price } = celldata as unknown as ProductState;
          return discount ? (
            <div className="price_container w-full h-fit flex flex-col items-start">
              <p className="font-bold">{`Discounted price: ${discount.newprice}USD`}</p>
              <p className="text-red-500">{`Discount: %${discount.percent}`}</p>
              <p>{`Price: ${price}USD`}</p>
            </div>
          ) : (
            celldata[key]
          );
        }

        case "category":
          const { category } = celldata as unknown as ProductState;
          return (
            <div className="category_container w-full h-fit inline-flex gap-x-3">
              <p>{category.parent.name}</p>
              {category.child && (
                <>
                  <span>{` / `}</span>
                  <p>{category?.child?.name}</p>
                </>
              )}
            </div>
          );

        case "stock":
          const { stocktype, id } = celldata as unknown as ProductState;
          return stocktype === StockType.Stock ? (
            celldata[key]
          ) : (
            <Button
              onPress={() => id && handleView(key, id)}
              variant="solid"
              color="primary"
              className="font-bold"
            >
              VIEW
            </Button>
          );

        case "Products":
        case "other":
          return (
            <Button
              onPress={() => celldata.id && handleView(key, celldata.id)}
              variant="solid"
              color="primary"
              className="font-bold"
            >
              VIEW
            </Button>
          );

        case "action":
          return (
            <ActionContainer
              onAction={(val) =>
                handleAction(
                  val as ActionState,
                  celldata.id,
                  ty as InventoryPage
                )
              }
            />
          );

        default:
          return celldata[key.toString()];
      }
    },
    [memoizedTy, handleClick, handleView, handleAction, ty]
  );
  return (
    <>
      <div className="table_container w-full p-2 h-full min-w-[900px]">
        <Table
          isHeaderSticky
          removeWrapper
          selectedKeys={selectedData}
          onSelectionChange={setselectedData}
          aria-label="table container for product promotion and banner"
          className="w-full min-h-[500px] h-full"
          selectionMode={singleselect ? "single" : "multiple"}
          showSelectionCheckboxes
          topContent={<TopTableContent />}
        >
          <TableHeader
            columns={renderColumn()}
            className="bg_default text-white"
          >
            {(column) => (
              <TableColumn
                className="text-black text-lg"
                key={column.uid}
                align={column.uid === "action" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner />}
            items={data ?? []}
            emptyContent={"Click on Create Button To Create New Items"}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell
                    className="border-b-1 border-gray-300"
                    key={columnKey}
                  >
                    {renderCell(columnKey, item as never)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TableBottomContent {...pagination} />
      </div>
    </>
  );
}
