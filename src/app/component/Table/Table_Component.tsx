"use client";
import {
  Button,
  ButtonProps,
  Chip,
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
import { Key, useCallback, useMemo, useState, memo } from "react";
import {
  ActionState,
  BannerState,
  FullCategoryType,
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
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { formatDate } from "../EmailTemplate";
import {
  Allstatus,
  Ordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { getStatusColor } from "@/src/lib/additionalutitlites";
import { ShippingOptionTypes } from "@/src/context/Checkoutcontext";

interface TableComponentProps {
  ty: InventoryPage;
  settype?: React.Dispatch<React.SetStateAction<InventoryPage>>;
  data?: Array<ProductState | BannerState | PromotionState | UserState>;
  onAction?: (key: string) => void;
  isLoading?: boolean;
  onSelection?: (key: Array<number | string>) => void;
  onPagination: (ty: "page" | "limit", val: string) => void;
  pagination: tableBottomContentProps;
  singleselect?: boolean;
  selectedvalue?: Array<number | string>;
  isAdmin?: boolean;
}

type ColumnType = {
  name: string;
  uid: string;
  view?: boolean;
  isAdmin?: boolean;
};

// Memoize static column definitions
const COLUMNS_CONFIG: Readonly<Record<InventoryPage, Array<ColumnType>>> = {
  usermanagement: [
    { name: "Id", uid: "id" },
    { name: "Name", uid: "name" },
    { name: "Email", uid: "email" },
    { name: "Role", uid: "role" },
    { name: "Other", uid: "other" },
    { name: "Action", uid: "action" },
  ],
  product: [
    { name: "Id", uid: "id" },
    { name: "Cover", uid: "covers" },
    { name: "Name", uid: "name" },
    { name: "Price", uid: "price" },
    { name: "Category", uid: "category" },
    { name: "Stock", uid: "stock" },
    { name: "Action", uid: "action" },
  ],
  banner: [
    { name: "Id", uid: "id" },
    { name: "Image", uid: "Image" },
    { name: "Name", uid: "name" },
    { name: "Size", uid: "size" },
    { name: "Link Type", uid: "linktype" },
    { name: "Action", uid: "action" },
  ],
  promotion: [
    { name: "Id", uid: "id" },
    { name: "Name", uid: "name" },
    { name: "Banner", uid: "banner" },
    { name: "Product", uid: "products" },
    { name: "Expire At", uid: "expireAt" },
    { name: "Action", uid: "action" },
  ],
  ordermanagement: [
    { name: "Id", uid: "id" },
    { name: "Buyer", uid: "user", isAdmin: true },
    { name: "Status", uid: "status" },
    { name: "Price", uid: "price" },
    { name: "Product", uid: "products" },
    { name: "Shipping", uid: "shippingtype" },
    { name: "Action", uid: "action" },
  ],
} as const;

interface Stock {
  type: string;
  value: number;
}

// Memoized cell components
const MemoizedImage = memo(
  ({
    data,
    onClick,
    alt,
  }: {
    data: ImageDatatype;
    onClick: () => void;
    alt: string;
  }) => (
    <Image
      className="w-[100px] h-[100px] object-contain rounded-sm bg-white cursor-pointer"
      onClick={onClick}
      width={100}
      height={100}
      loading="lazy"
      alt={alt}
      src={data.url}
    />
  )
);
MemoizedImage.displayName = "MemoizedImage";

const MemoizedProductName = memo(
  ({
    celldata,
    handleClick,
  }: {
    celldata: Record<string, string>;
    handleClick: () => void;
  }) => (
    <div
      className="name w-full h-fit hover:text-gray-300 active:text-gray-300 cursor-pointer"
      onClick={handleClick}
    >
      {celldata.name}
      {celldata?.lowstock && (
        <span className="text-red-500 text-sm pl-2">{"(Low Stock)"}</span>
      )}
      {celldata?.isExpired && (
        <span className="text-red-500 text-sm pl-2">{"(Expired)"}</span>
      )}
    </div>
  )
);
MemoizedProductName.displayName = "MemoizedProductName";

const MemoizedUserName = memo(
  ({ celldata }: { celldata: Record<string, string> }) => (
    <div className="username">
      <p>{`Username: ${celldata.username ?? ""}`}</p>
      <p>{`Firstname: ${celldata.firstname}`}</p>
      {celldata?.lastname && <p>{`Lastname: ${celldata.lastname}`}</p>}
    </div>
  )
);
MemoizedUserName.displayName = "MemoizedUserName";

const MemoizedPrice = memo(
  ({
    celldata,
    ty,
  }: {
    celldata: Record<string, string>;
    ty: InventoryPage;
  }) => {
    if (ty === "product") {
      const { discount, price } = celldata as unknown as ProductState;
      return discount ? (
        <div className="price_container w-full h-fit flex flex-col items-start">
          <p className="font-bold">{`Discounted price: ${discount.newprice} USD`}</p>
          <p className="text-red-500">{`Discount: %${discount.percent}`}</p>
          <p>{`Price: ${price} USD`}</p>
        </div>
      ) : (
        `${price} (USD)`
      );
    } else if (ty === "ordermanagement") {
      const orderpice = (celldata as unknown as Ordertype)
        ?.price as totalpricetype;
      return (
        <ul className="pricelist flex flex-col gap-y-3">
          {Object.entries(orderpice).map(([key, val], idx) => (
            <li key={idx}>{`${key.toUpperCase()} : ${val} (USD)`}</li>
          ))}
        </ul>
      );
    }
    return null;
  }
);
MemoizedPrice.displayName = "MemoizedPrice";

const MemoizedCategory = memo(
  ({ category }: { category: FullCategoryType }) => (
    <div className="category_container w-full h-fit inline-flex gap-x-3">
      <p>{category.parent.name}</p>
      {category.child && (
        <>
          <span>{` / `}</span>
          <p>{category?.child?.name}</p>
        </>
      )}
    </div>
  )
);
MemoizedCategory.displayName = "MemoizedCategory";

const MemoizedActionButton = memo(
  ({
    onPress,
    children,
    variant = "solid",
    color = "primary",
  }: ButtonProps) => (
    <Button
      onPress={onPress}
      variant={variant}
      color={color}
      className="font-bold"
    >
      {children}
    </Button>
  )
);
MemoizedActionButton.displayName = "MemoizedActionButton";

function TableComponent({
  ty,
  data,
  isLoading,
  onSelection,
  pagination,
  singleselect,
  selectedvalue,
  isAdmin,
  settype,
}: TableComponentProps) {
  const {
    setopenmodal,
    setglobalindex,
    setproduct,
    setreloaddata,
    setpromotion,
    promotion,
  } = useGlobalContext();

  const [selectedData, setselectedData] = useState<Selection>(
    () => new Set(selectedvalue ?? [])
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize columns based on type and admin status
  const columns = useMemo(() => {
    const baseColumns = COLUMNS_CONFIG[ty] || COLUMNS_CONFIG.product;
    return baseColumns.filter((col) => (col.isAdmin ? isAdmin : true));
  }, [ty, isAdmin]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    alert("Open Detail with photo and title");
  }, []);

  const handleView = useCallback(
    (uid: string, id: number | string) => {
      if (!id) return;

      const stateUpdates: {
        modal?: Partial<OpenModalState>;
        index?: Partial<GlobalIndexState>;
      } = {};

      switch (uid) {
        case "stock":
          stateUpdates.modal = { editvariantstock: true };
          stateUpdates.index = { producteditindex: id as number };
          break;

        case "products":
          stateUpdates.modal = { showproduct: true };
          if (ty === "ordermanagement") {
            stateUpdates.index = { orderId: id as string };
          } else if (ty === "promotion") {
            setpromotion((prev) => ({ ...prev, view: "product" }));
            const newParams = new URLSearchParams(searchParams);
            newParams.set("ty", "product");
            newParams.set("promoids", String(id));
            router.push(`?${newParams}`);
            settype?.("product");
            setreloaddata(true);
            return;
          }
          break;

        case "Image":
          stateUpdates.modal = { [`showbanner${id}`]: true };
          stateUpdates.index = { bannereditindex: id as number };
          break;

        case "covers":
          stateUpdates.modal = { [`cover${id}`]: true };
          stateUpdates.index = { producteditindex: id as number };
          break;

        case "other":
        case "user":
        case "shippingtype":
          if (ty === "ordermanagement" && uid === "user" && !isAdmin) return;

          if (ty === "ordermanagement") {
            if (uid === "shippingtype") {
              stateUpdates.modal = { orderdetail: true };
            }
            stateUpdates.index = { orderId: id as string };
          } else if (ty === "usermanagement") {
            stateUpdates.modal = { userdetail: true };
            stateUpdates.index = { useredit: id as number };
          } else {
            stateUpdates.modal = { other: true };
            stateUpdates.index = { useredit: id as number };
          }
          break;

        default:
          return;
      }

      if (stateUpdates.index) {
        setglobalindex((prev) => ({ ...prev, ...stateUpdates.index }));
      }
      if (stateUpdates.modal) {
        setopenmodal(stateUpdates.modal);
      }
    },
    [
      router,
      isAdmin,
      searchParams,
      setglobalindex,
      setopenmodal,
      setpromotion,
      setreloaddata,
      settype,
      ty,
    ]
  );

  const handleAction = useCallback(
    (key: ActionState, id: number, type: InventoryPage, stock?: Stock) => {
      if (!id) return;

      const modalState: Partial<OpenModalState> = {};
      const indexState: Partial<GlobalIndexState> = {};

      const config = {
        product: { createKey: "createProduct", indexKey: "producteditindex" },
        banner: { createKey: "createBanner", indexKey: "bannereditindex" },
        promotion: {
          createKey: "createPromotion",
          indexKey: "promotioneditindex",
        },
        usermanagement: { createKey: "createUser", indexKey: "useredit" },
        ordermanagement: { createKey: "updateStatus", indexKey: "orderId" },
      } as const;

      const { createKey, indexKey } = config[type];

      if (key === "edit") {
        if (createKey === "createProduct") {
          router.push(`/dashboard/inventory/createproduct/${id}`);
        } else if (createKey === "createUser") {
          router.push(`/dashboard/usermanagement/${id}`);
        } else {
          modalState[createKey] = true;
        }
        indexState[indexKey] = id as never;
      } else if (key === "delete") {
        modalState.confirmmodal = {
          index: id,
          type: type === "usermanagement" ? "user" : type,
          open: true,
          onDelete() {
            setreloaddata(true);
          },
        };
      } else if (type === "product" && stock) {
        modalState[`${stock.type}${id}`] = true;
        setproduct((prev) => ({ ...prev, id, stock: stock.value }));
      }

      setopenmodal((prev) => ({ ...prev, ...modalState } as never));
      setglobalindex((prev) => ({ ...prev, ...indexState }));
    },
    [router, setglobalindex, setopenmodal, setproduct, setreloaddata]
  );

  const renderCell = useCallback(
    (key: Key, celldata: { [x: string]: never }) => {
      if (!celldata) return null;
      const keyString = key.toString();

      switch (key) {
        case "Image":
        case "covers":
        case "banner": {
          const data = (celldata[keyString] &&
            (celldata[keyString][0] ||
              (keyString === "banner"
                ? (celldata[keyString] as BannerState).Image
                : celldata[keyString]))) as ImageDatatype;

          if (!data) return null;

          return (
            <MemoizedImage
              data={data}
              onClick={() => handleView(keyString, celldata.id)}
              alt={`cover${data.url}`}
            />
          );
        }

        case "name":
          if (ty === InventoryType.Product || ty === InventoryType.Promotion) {
            return (
              <MemoizedProductName
                celldata={celldata}
                handleClick={handleClick}
              />
            );
          } else if (ty === "usermanagement") {
            return <MemoizedUserName celldata={celldata} />;
          }
          return celldata[keyString];

        case "price":
          return <MemoizedPrice celldata={celldata} ty={ty} />;

        case "category":
          return (
            <MemoizedCategory
              category={(celldata as unknown as ProductState).category}
            />
          );

        case "stock":
          const { stocktype, id } = celldata as unknown as ProductState;
          return stocktype === StockType.Stock ? (
            celldata[keyString]
          ) : (
            <MemoizedActionButton
              onPress={() => id && handleView(keyString, id)}
            >
              VIEW
            </MemoizedActionButton>
          );

        case "products":
        case "other":
        case "user":
          return (
            <MemoizedActionButton
              onPress={() => celldata.id && handleView(keyString, celldata.id)}
            >
              VIEW
            </MemoizedActionButton>
          );

        case "shippingtype":
          const shippingData = celldata[keyString];
          return shippingData !== ShippingOptionTypes.pickup ? (
            <MemoizedActionButton
              onPress={() => celldata.id && handleView(keyString, celldata.id)}
            >
              VIEW
            </MemoizedActionButton>
          ) : (
            <Chip color="primary" variant="bordered">
              {shippingData ?? "None"}
            </Chip>
          );

        case "action":
          return !promotion.selectproduct && !promotion.selectbanner ? (
            ty === "ordermanagement" ? (
              <MemoizedActionButton
                onPress={() => {
                  setopenmodal({ orderactionmodal: true });
                  setglobalindex({ orderId: celldata.id } as never);
                }}
              >
                Action
              </MemoizedActionButton>
            ) : (
              <ActionContainer
                onAction={(val) =>
                  handleAction(
                    val as ActionState,
                    celldata.id,
                    ty as InventoryPage
                  )
                }
              />
            )
          ) : (
            <></>
          );

        case "expireAt":
          return celldata[keyString]
            ? formatDate(new Date(celldata[keyString]))
            : "none";

        case "status":
          const status = celldata[keyString] as Allstatus;
          return <Chip className={getStatusColor(status)}>{status}</Chip>;

        default:
          return celldata[keyString] ?? "none";
      }
    },
    [
      ty,
      promotion.selectproduct,
      promotion.selectbanner,
      handleView,
      handleClick,
      setopenmodal,
      setglobalindex,
      handleAction,
    ]
  );

  // Effect for selection changes

  const handleSelectionKey = useCallback(
    (val: Selection) => {
      if (onSelection) {
        const convertedToNumber = Array.from(val);
        onSelection(convertedToNumber);
      }
      setselectedData(val);
    },
    [onSelection]
  );

  return (
    <div className="table_container w-full p-2 h-full min-w-[900px]">
      <Table
        isHeaderSticky
        removeWrapper
        selectedKeys={selectedData}
        onSelectionChange={handleSelectionKey}
        aria-label="table container for product promotion and banner"
        className="w-full min-h-[500px] h-full"
        selectionMode={singleselect ? "single" : "multiple"}
        showSelectionCheckboxes
        topContent={<TopTableContent />}
      >
        <TableHeader columns={columns} className="bg_default text-white">
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
                  className="border-b-1 border-gray-300 relative"
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
  );
}

export default memo(TableComponent);
