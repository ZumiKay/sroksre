import {
  Accordion,
  AccordionItem,
  Button,
  Selection,
  Skeleton,
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
} from "@/src/context/GlobalType.type";
import {
  ActionContainer,
  TableBottomContent,
  tableBottomContentProps,
} from "./Component";
import { useGlobalContext } from "@/src/context/GlobalContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";

interface TableComponentProps {
  ty: InventoryPage;
  data?: Array<ProductState | BannerState | PromotionState>;
  onAction?: (key: string) => void;
  isLoading?: boolean;
  onSelection?: (key: Array<number>) => void;
  onPagination: (ty: "page" | "limit", val: string) => void;
  pagination: tableBottomContentProps;
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
}: TableComponentProps) {
  const { setopenmodal, setglobalindex, setproduct } = useGlobalContext();
  const [selectedData, setselectedData] = useState<Selection>(new Set([]));
  const Router = useRouter();
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

  const handleView = useCallback((uid: string, id: number) => {
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
    }

    setglobalindex((prev) => ({ ...prev, ...toUpdateIndex }));
    setopenmodal(toOpenModal);
  }, []);

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
      };

      const { createKey, indexKey } = config[type as InventoryPage];

      if (key === "edit") {
        if (createKey === "createProduct") {
          Router.push(`/dashboard/inventory/createproduct/${id}`);
        } else modalState[createKey] = true;
        indexState[indexKey] = id as any;
      } else if (key === "delete") {
        modalState.confirmmodal = { index: id, type, open: true };
      } else if (type === "product" && stock) {
        modalState[`${stock.type}${id}`] = true;
        setproduct((prev) => ({ ...prev, id, stock: stock.value }));
      }

      setopenmodal((prev) => ({ ...prev, ...modalState } as never));
      setglobalindex((prev) => ({ ...prev, ...indexState }));
    },
    [setopenmodal, setglobalindex, setproduct]
  );

  const renderCell = useCallback(
    (key: Key, celldata: Record<string, any>) => {
      if (!celldata) return null;

      switch (key) {
        case "image":
        case "covers":
        case "banner": {
          const data = celldata[key][0] ? celldata[key][0] : celldata[key];
          if (!data) return null;
          return (
            <Image
              className="w-[100px] h-[100px] object-cover rounded-sm"
              onClick={() => handleView(key, celldata.id)}
              width={100}
              height={100}
              loading="lazy"
              alt={data.name}
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
              {category.child && (
                <>
                  <span>{` / `}</span>
                  <p>{category?.child?.name}</p>
                </>
              )}
            </div>
          );

        case "stock":
          const { stocktype, id } = celldata as ProductState;
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
                handleAction(val as ActionState, celldata.id, ty)
              }
            />
          );

        default:
          return celldata[key.toString()];
      }
    },
    [memoizedTy, handleClick, handleAction, handleView]
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
          selectionMode="multiple"
          showSelectionCheckboxes
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
                    {renderCell(columnKey, item)}
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
