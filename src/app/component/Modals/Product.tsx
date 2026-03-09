import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";
import {
  CateogoryState,
  Productinitailizestate,
  ProductStockType,
  SubcategoriesState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import PrimaryButton from "../Button";
import ToggleMenu, { SearchAndMultiSelect } from "../ToggleMenu";
import { Variantcontainer } from "./VariantModal";
import { ImageUpload } from "./Image";
import { SecondaryModal } from "../Modals";
import { ProductState, StockTypeEnum } from "@/src/types/product.type";
import { ImageSection } from "./product/ImageSection";
import { ProductInfoFields } from "./product/ProductInfoFields";
import { CategorySection } from "./product/CategorySection";
import { StockSection } from "./product/StockSection";
import { DetailsModal } from "./product/DetailsModal";
import { LoadingOverlay } from "./product/LoadingOverlay";
import { CleanUpTempImage } from "../../product/utils";

const CreateProductsInitailize = async (
  asyncFunctions: Array<Promise<void | boolean> | boolean>,
) => {
  try {
    const allreq = await Promise.allSettled(asyncFunctions.filter(Boolean));
    if (allreq.some((req) => req.status === "rejected")) {
      throw Error();
    }
    return true;
  } catch (error) {
    errorToast("Initialize Error Occured");

    console.log("Intialize Error", error);
    return false;
  }
};

export function CreateProducts({
  setreloaddata,
}: {
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    openmodal,
    setopenmodal,
    product,
    setproduct,
    globalindex,
    setglobalindex,
    isLoading,
    setisLoading,
  } = useGlobalContext();

  const { isMobile } = useScreenSize();

  const detailref = useRef<HTMLDivElement>(null);
  const [loading, setloading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [stocktype, setstocktype] = useState<"stock" | "variant" | "size">(
    "stock",
  );

  const [subcate, setsubcate] = useState<Array<SubcategoriesState>>([]);

  const [cate, setcate] = useState<Array<CateogoryState> | undefined>(
    undefined,
  );

  const fetchcate = useCallback(
    async (products?: ProductState) => {
      setCategoriesLoading(true);
      const asyncfunc = async () => {
        const categories = await ApiRequest(
          "/api/categories?ty=create",
          undefined,
          "GET",
        );
        if (categories.success) {
          setcate(categories.data);
          const { parent_id } = products
            ? { ...products.category }
            : { ...product.category };

          const subcates: CateogoryState = categories.data.find(
            (i: CateogoryState) => i.id === parent_id,
          );

          setsubcate(subcates?.subcategories ?? []);
        }
        setCategoriesLoading(false);
      };
      await Delayloading(asyncfunc, setloading, 1000);
    },
    [ApiRequest],
  );

  /**Initialize Process */
  useEffect(() => {
    const fetchproductdata = async (id: number) => {
      setloading(true);
      const request = await ApiRequest(
        `/api/products?ty=info&pid=${id}`,
        undefined,
        "GET",
        undefined,
        undefined,
        "product",
      );
      if (!request.success) {
        errorToast("Connection Problem");
        return;
      }

      const data: ProductState = request.data;

      const isExist = data.details.findIndex(
        (i) => i.info_type === "COLOR" || i.info_type === "TEXT",
      );
      if (isExist !== -1) {
        setstocktype("variant");
      }

      setproduct(request.data);

      await fetchcate(request.data); //fetch categories

      setloading(false);

      request.data.stocktype && setstocktype(request.data.stocktype);
    };
    if (globalindex.producteditindex && globalindex.producteditindex !== -1) {
      setloading(true);
    }
    CreateProductsInitailize([
      globalindex.producteditindex === -1 && fetchcate(),
      globalindex.producteditindex !== -1 &&
        fetchproductdata(globalindex.producteditindex),
      CleanUpTempImage(),
    ]);

    console.log("Create product useEffect Run");
  }, [globalindex.producteditindex, fetchcate]);

  useEffect(() => {
    detailref.current &&
      detailref.current.scrollIntoView({
        behavior: "smooth",
      });
  }, [openmodal.productdetail]);

  // When the virtual keyboard opens it shrinks the visual viewport.
  // Scroll the currently-focused input/textarea back into view so it
  // is never hidden behind the keyboard.
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportResize = () => {
      const focused = document.activeElement as HTMLElement | null;
      if (
        focused &&
        (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA")
      ) {
        setTimeout(() => {
          focused.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);

    return () =>
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportResize,
      );
  }, []);

  //Method

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const createdproduct = { ...product };
    const URL = "/api/products/crud";

    if (product.covers.length === 0 || !product.category.parent_id) {
      errorToast(
        `${
          !product.category.parent_id ? "Category" : "Cover Image"
        } is Required`,
      );
      return;
    }

    if (globalindex.producteditindex === -1) {
      const created = await ApiRequest(URL, setisLoading, "POST", "JSON", {
        createdproduct,
      });
      if (!created.success) {
        errorToast(created.error as string);
        return;
      }

      setproduct(Productinitailizestate);
      successToast(`${product.name} Created`);
    } else {
      //updateProduct

      const updated = await ApiRequest(URL, setisLoading, "PUT", "JSON", {
        ...createdproduct,
        relatedproductid: createdproduct.relatedproductid
          ? [
              createdproduct.id,
              ...(createdproduct.relatedproductid as number[]),
            ]
          : undefined,
      });
      if (!updated.success) {
        errorToast(updated.error as string);
        return;
      }

      successToast(`${product.name} Updated`);
    }

    setproduct(Productinitailizestate);
    setreloaddata(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    // Validation for positive numbers
    if (name === "price" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setproduct({
      ...product,
      [name]: value,
    });
  };
  const handleSelect = (value: string, name: "parent_id" | "child_id") => {
    if (name === "parent_id") {
      const subcates = cate?.find(
        (i) => i.id?.toString() === value,
      )?.subcategories;
      setsubcate(subcates ?? []);
    }

    setproduct({
      ...product,
      category: { ...product.category, [name]: parseInt(value) },
    });
  };

  const handleStocktypeChange = (value: string) => {
    const updated = { ...product };

    if (
      value === ProductStockType.size ||
      value === ProductStockType.stock ||
      value === ProductStockType.variant
    ) {
      updated.stock = 0;
    }

    if (
      value === ProductStockType.stock ||
      value === ProductStockType.variant
    ) {
      const idx = updated.details?.findIndex((i) => i.info_type === "SIZE");
      if (idx !== undefined && idx !== -1) updated.details?.splice(idx, 1);
    } else {
      updated.Variant = undefined;
      updated.Stock = undefined;
    }

    updated.stocktype = value as StockTypeEnum;
    setproduct(updated);
    setstocktype(value as "stock" | "variant" | "size");
  };

  const handleCancel = async () => {
    setproduct(Productinitailizestate);
    setopenmodal({ ...openmodal, createProduct: false });
    setglobalindex({ ...globalindex, producteditindex: -1 });
  };

  return (
    <>
      <SecondaryModal
        open={openmodal.createProduct}
        size="full"
        placement="top"
        scroll="inside"
        isForm={{
          className: `createform w-full
          overflow-y-auto overflow-x-hidden relative bg-linear-to-br from-gray-50 to-gray-100
          p-2 sm:p-4 md:p-6 lg:p-8 rounded-lg`,

          onSubmit: handleSubmit,
        }}
        header={() => {
          return (
            <>
              {openmodal.imageupload && (
                <ImageUpload
                  limit={4}
                  mutitlple={true}
                  type="createproduct"
                  setreloaddata={setreloaddata}
                />
              )}
              {openmodal.addproductvariant && <Variantcontainer />}
            </>
          );
        }}
        footer={() => {
          return (
            <div className="w-full h-fit flex flex-row gap-2 sm:gap-4 md:gap-5 justify-between px-2 sm:px-4 md:px-6 py-2">
              <PrimaryButton
                color="#44C3A0"
                text={
                  loading
                    ? "Loading..."
                    : isLoading.POST || isLoading.PUT
                      ? "Saving..."
                      : globalindex.producteditindex === -1
                        ? "Create"
                        : "Update"
                }
                type={"submit"}
                radius="10px"
                width="100%"
                height="45px"
                disable={loading || isLoading.POST || isLoading.PUT}
              />
              <PrimaryButton
                color="#F08080"
                text="Cancel"
                type="button"
                radius="10px"
                width="100%"
                height="45px"
                disable={loading || isLoading.POST || isLoading.PUT}
                onClick={() => {
                  handleCancel();
                }}
              />
            </div>
          );
        }}
      >
        {(loading || isLoading.PUT || isLoading.POST) && <ContainerLoading />}

        <div
          className="product__form w-full
          flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16
          h-fit overflow-y-auto overflow-x-hidden items-start justify-center
          lg:items-start
          "
        >
          <ImageSection loading={loading} />

          <div
            className="productinfo flex flex-col justify-start items-stretch
              w-full lg:w-1/2 lg:flex-1
              h-fit gap-y-3 sm:gap-y-5 md:gap-y-6
              bg-white rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200
              "
          >
            {loading && <LoadingOverlay message="Loading product data..." />}

            <ProductInfoFields handleChange={handleChange} loading={loading} />

            <div
              className="w-full h-fit flex flex-col gap-y-3 z-50 
                bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
            >
              <label className="font-semibold text-sm text-gray-700">
                Add related product (Optional)
              </label>
              <SearchAndMultiSelect />
            </div>

            <CategorySection
              cate={cate}
              subcate={subcate}
              parentId={product.category.parent_id || undefined}
              childId={product.category.child_id || undefined}
              categoriesLoading={categoriesLoading}
              onSelect={handleSelect}
            />

            <StockSection
              stocktype={stocktype}
              loading={loading}
              handleChange={handleChange}
              onStocktypeChange={handleStocktypeChange}
            />

            <div
              className="toggleMenu_section w-full h-fit p-4 transition cursor-pointer 
                  rounded-lg bg-linear-to-r from-gray-50 to-slate-50 
                  border-2 border-gray-300 hover:border-blue-400 hover:shadow-md"
            >
              <ToggleMenu
                name="Product Details"
                data={product.details}
                isAdmin={true}
              />
            </div>
            {!openmodal.productdetail ? (
              <PrimaryButton
                color="#0097FA"
                text="Add more detail"
                onClick={() => {
                  setglobalindex((prev) => ({
                    ...prev,
                    productdetailindex: -1,
                  }));
                  setopenmodal({ ...openmodal, productdetail: true });
                }}
                type="button"
                radius="10px"
                width="100%"
                height="35px"
              />
            ) : (
              <div ref={detailref} className="w-full h-full">
                <DetailsModal />
              </div>
            )}
          </div>
        </div>
      </SecondaryModal>
    </>
  );
}
