"use client";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { PrimaryPhoto } from "@/src/app/component/PhotoComponent";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { Button, Divider, Form, Input, NumberInput } from "@heroui/react";
import { AsyncSelection } from "@/src/app/component/AsynSelection";
import { ProductDetailCreateSection, StockCreateSection } from "./component";
import { SearchAndMultiSelect } from "@/src/app/component/ToggleMenu";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "@/src/app/component/Loading";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/src/app/component/Modals/Image";
import { Variantcontainer } from "@/src/app/component/Modals/VariantModal";
import { categorytype, ProductState } from "@/src/context/GlobalType.type";
import { compareArrays, IsNumber } from "@/src/lib/utilities";
import ImageIcon from "../../../../../../public/Image/ImageIcon.png";
import Image from "next/image";

const FetchCategory = async ({
  ty,
  offset,
  pid,
  type,
}: {
  ty: "parent" | "child";
  offset: number;
  pid?: number;
  type?: string;
}) => {
  const makereq = await ApiRequest({
    url:
      "/api/categories/select" +
      `?ty=${ty}${type ? `&catetype=${type}` : ""}&take=${offset}${
        pid ? `&pid=${pid}` : ""
      }`,
    method: "GET",
    revalidate: "selectcate",
  });
  if (!makereq.success) {
    return;
  }
  return makereq.data;
};

const FetchEditProduct = async (id: string) => {
  const getReq = await ApiRequest({
    url: `/api/products?ty=info&pid=${id}`,
    method: "GET",
    revalidate: "product",
  });
  if (!getReq.success) {
    return { success: false };
  }

  return { success: true, data: getReq.data };
};

const CreateProductPage = ({ params }: { params: { editId?: string } }) => {
  const { openmodal, product, setproduct, setopenmodal, setglobalindex } =
    useGlobalContext();
  const { isMobile, isTablet } = useScreenSize();
  const [loading, setloading] = useState(false);
  const [isChange, setisChange] = useState<boolean | undefined>();
  const [tempProduct, settempProduct] = useState<ProductState | undefined>(
    undefined
  );
  const Router = useRouter();
  const IsEdit =
    params.editId && IsNumber(params.editId)
      ? Number(params.editId) > 0
      : false;

  useEffect(() => {
    if (params.editId && !IsNumber(params.editId)) {
      return Router.push("/notfound");
    }

    if (params.editId && Number(params.editId)) {
      const asyncGetData = async () => {
        setloading(true);
        const data = await FetchEditProduct(params.editId as string);
        setloading(false);
        if (!data.success) {
          return Router.push("/notfound");
        }
        setproduct(data.data);
        settempProduct(data.data);
        setglobalindex((prev) => ({
          ...prev,
          producteditindex: Number(params.editId),
        }));
      };
      asyncGetData();
    }
  }, [params.editId]);

  useEffect(() => {
    if (tempProduct) {
      const isDiffrent = compareArrays([tempProduct], [product], {
        deepCompare: true,
      });

      setisChange(isDiffrent);
    }
  }, [product]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const name = e.target.name;

      // Validation for positive numbers
      if (name === "price" && !/^\d*\.?\d{0,2}$/.test(value)) {
        return;
      }

      setproduct((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [setproduct]
  );

  const CreateAndUpdateProduct = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setloading(true);
      const makeReq = await ApiRequest({
        url: "/api/products/crud",
        method: IsEdit ? "PUT" : "POST",
        data: product,
      });
      setloading(false);

      if (!makeReq.success) {
        errorToast(makeReq.error ?? "Error Occured");
        return;
      }

      if (!IsEdit) {
        setproduct(Productinitailizestate);
      }
      successToast(IsEdit ? "Product Updated" : "Product Created");
    },
    [setproduct, setglobalindex, IsEdit, product]
  );

  const handleCancel = () => {
    Router.back();
  };
  return (
    <>
      {openmodal.imageupload && (
        <ImageUpload limit={4} mutitlple={true} type="createproduct" />
      )}
      {openmodal.addproductvariant && <Variantcontainer />}
      <div className="createproduct_page w-full min-h-screen h-full flex flex-col items-start gap-y-5">
        <h1 className="w-fit h-fit text-center p-3 bg_default text-white">
          {IsEdit ? "Edit Product" : "Create Product"}
        </h1>
        {loading && <ContainerLoading />}
        <Form
          className="w-full h-fit flex flex-row gap-x-3 max-smaller_screen:flex-col max-smaller_screen:gap-y-5 max-smaller_screen:items-center"
          aria-label="create product form"
          onSubmit={CreateAndUpdateProduct}
        >
          <div className="image_section min-w-[300px] w-2/3 h-full flex flex-col gap-y-3 items-center ">
            <div className="w-fit h-fit relative">
              <PrimaryPhoto
                data={product.covers}
                showcount={true}
                hover={true}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </div>
            <Button
              className="text-white bg_default  font-bold"
              size="lg"
              fullWidth
              radius="none"
              startContent={
                <Image src={ImageIcon} alt="imageicon" width={20} height={20} />
              }
              onPress={() => setopenmodal({ imageupload: true })}
              variant="flat"
            >
              {product.covers.length ? "Change Image" : "Add Image"}
            </Button>
          </div>
          <div className="input_section w-full h-fit flex flex-col justify-center gap-y-10 pr-5 max-smaller_screen:p-2 ">
            <Input
              isRequired
              type="text"
              label="Product Name"
              labelPlacement="outside"
              placeholder="Name"
              name="name"
              onChange={handleChange}
              value={product.name}
              errorMessage=""
              size="lg"
              className="w-[100%] h-[40px]  font-bold rounded-md"
            />
            <Input
              isRequired
              type="text"
              label="Short Description"
              placeholder="Description"
              labelPlacement="outside"
              errorMessage=""
              name="description"
              onChange={handleChange}
              value={product.description}
              size="lg"
              className="w-[100%] h-[40px] text-lg pl-1 font-bold rounded-md "
            />
            <NumberInput
              isRequired
              label="Price"
              labelPlacement="outside"
              placeholder="0.00"
              className="h-[40px] text-lg font-bold"
              size="lg"
              minValue={0.0}
              value={product.price}
              name="price"
              onValueChange={(val) =>
                setproduct((prev) => ({ ...prev, price: val }))
              }
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">$</span>
                </div>
              }
            />

            <h3>Category Section</h3>
            <Divider />
            <div className="w-full h-fit flex flex-row justify-start items-start gap-3 flex-wrap">
              <AsyncSelection
                data={(take) =>
                  take
                    ? FetchCategory({
                        ty: "parent",
                        offset: take,
                        type: categorytype.normal,
                      })
                    : undefined
                }
                type="async"
                option={{
                  name: "parent",
                  label: "Parent Categories",
                  size: "lg",
                  labelPlacement: "outside",
                  placeholder: "Select",
                  selectedKeys: product.category.parent.id
                    ? [product.category.parent.id.toString()]
                    : undefined,
                  isRequired: true,
                  onChange: (e) => {
                    setproduct(
                      (prev) =>
                        ({
                          ...prev,
                          category: {
                            ...prev.category,
                            parent: { id: Number(e.target.value) },
                          },
                        } as any)
                    );
                  },
                }}
              />

              <AsyncSelection
                type={product.category.parent.id ? "async" : "normal"}
                forceRefetch={product.category.parent.id}
                data={(take) =>
                  take
                    ? FetchCategory({
                        ty: "child",
                        pid: product.category.parent.id,
                        offset: take,
                      })
                    : undefined
                }
                option={{
                  name: "child",
                  label: "Child Categories",
                  size: "lg",
                  selectedKeys: product.category.child
                    ? [`${product.category.child.id}`]
                    : undefined,
                  isDisabled: !product.category.parent.id,
                  labelPlacement: "outside",
                  placeholder: "Select",
                  onChange: (e) =>
                    setproduct(
                      (prev) =>
                        ({
                          ...prev,
                          category: {
                            ...prev.category,
                            child: { id: Number(e.target.value) },
                          },
                        } as any)
                    ),
                }}
              />
            </div>
            <StockCreateSection />
            <Divider />
            <ProductDetailCreateSection />
            <div className="w-full h-fit flex flex-col gap-y-5 z-50">
              <label className="font-bold text-lg">
                Add related product (Optional)
              </label>
              <SearchAndMultiSelect />
            </div>
            <div className="btn w-full h-[40px] flex flex-row items-center justify-center gap-x-3">
              <Button
                type="submit"
                isLoading={loading}
                isDisabled={IsEdit ? isChange : false}
                className="font-bold w-full h-full bg-green-500 text-white"
              >
                {IsEdit ? "Update" : "Create"}
              </Button>
              <Button
                onPress={() => handleCancel()}
                className="font-bold w-full bg-red-300 h-full text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </>
  );
};

export default CreateProductPage;
