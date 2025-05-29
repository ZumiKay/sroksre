"use client";
import React, { FormEvent, useCallback, useEffect, useState, use } from "react";
import { PrimaryPhoto } from "@/src/app/component/PhotoComponent";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { Button, Form, Input, NumberInput } from "@heroui/react";
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
import {
  compareArrays,
  handleLocalstorage,
  IsNumber,
} from "@/src/lib/utilities";
import ImageIcon from "../../../../../../public/Image/ImageIcon.png";
import Image from "next/image";
import { FetchCategory, FetchEditProduct } from "./action";

const CreateProductPage = (props: { params: Promise<{ editId?: string }> }) => {
  const params = use(props.params);
  const { openmodal, setopenmodal, setglobalindex, product, setproduct } =
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

  // Add a state to track if data is loaded for edit mode
  const [dataLoaded, setDataLoaded] = useState(!IsEdit);

  useEffect(() => {
    if (params.editId && !IsNumber(params.editId)) {
      Router.push("/notfound");
      return;
    }

    if (params.editId && Number(params.editId)) {
      const fetchProductData = async () => {
        setloading(true);
        try {
          const data = await FetchEditProduct(params.editId as string);
          if (!data.success) {
            Router.push("/notfound");
            return;
          }

          setproduct(data?.data as never);
          settempProduct(data?.data as ProductState);
          setglobalindex((prev) => ({
            ...prev,
            producteditindex: Number(params.editId),
          }));
          // Mark data as loaded
          setDataLoaded(true);
        } catch (error) {
          Router.push("/notfound");
          throw error;
        } finally {
          setloading(false);
        }
      };
      fetchProductData();
    }
  }, [IsEdit, Router, params.editId, setglobalindex, setproduct]);

  useEffect(() => {
    if (tempProduct) {
      const isDiffrent = compareArrays([tempProduct], [product], {
        deepCompare: true,
      });

      setisChange(isDiffrent);
    }
  }, [tempProduct, product]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, name } = e.target;

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
      try {
        const makeReq = await ApiRequest({
          url: "/api/products/crud",
          method: IsEdit ? "PUT" : "POST",
          data: product,
        });

        if (!makeReq.success) {
          errorToast(makeReq.error ?? "Error Occurred");
          return;
        }

        if (!IsEdit) {
          setproduct(Productinitailizestate);
        }

        handleLocalstorage(product.covers.map((i) => i.id) as number[], true);
        successToast(IsEdit ? "Product Updated" : "Product Created");
      } catch (error) {
        errorToast("Failed to process request");
        throw error; // Re-throw the error for further handling if needed
      } finally {
        setloading(false);
      }
    },
    [IsEdit, product, setproduct]
  );

  const handleCancel = () => {
    setproduct(Productinitailizestate);
    Router.back();
  };

  const handleImageUpload = () => {
    setopenmodal({ imageupload: true });
  };

  // If in edit mode and data is not yet loaded, show loading state only
  if (IsEdit && !dataLoaded) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <ContainerLoading />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Modals */}
      {openmodal.imageupload && (
        <ImageUpload limit={4} mutitlple={true} type="createproduct" />
      )}
      {openmodal.addproductvariant && <Variantcontainer />}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="inline-block px-6 py-3 text-xl font-semibold bg_default text-white rounded-md shadow-sm">
            {IsEdit ? "Edit Product" : "Create Product"}
          </h1>
        </div>

        {loading && <ContainerLoading />}

        <Form
          className="bg-white shadow-md rounded-lg overflow-hidden"
          aria-label="create product form"
          onSubmit={CreateAndUpdateProduct}
        >
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Section */}
            <div className="lg:col-span-1 flex flex-col gap-5 items-center">
              <div className="w-full flex justify-center">
                <div className="relative">
                  <PrimaryPhoto
                    data={product.covers}
                    showcount={true}
                    hover={true}
                    isMobile={isMobile}
                    isTablet={isTablet}
                  />
                </div>
              </div>
              <Button
                className="text-white bg_default font-medium transition-transform hover:scale-105"
                size="lg"
                fullWidth
                radius="sm"
                startContent={
                  <Image
                    src={ImageIcon}
                    alt="imageicon"
                    width={20}
                    height={20}
                  />
                }
                onPress={handleImageUpload}
                variant="flat"
              >
                {product.covers.length ? "Change Image" : "Add Image"}
              </Button>
            </div>

            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-6 flex flex-col gap-y-5">
                <Input
                  isRequired
                  type="text"
                  label="Product Name"
                  labelPlacement="outside"
                  placeholder="Enter product name"
                  name="name"
                  onChange={handleChange}
                  value={product.name}
                  size="lg"
                  className="font-medium"
                />

                <Input
                  isRequired
                  type="text"
                  label="Short Description"
                  placeholder="Brief description of the product"
                  labelPlacement="outside"
                  name="description"
                  onChange={handleChange}
                  value={product.description}
                  size="lg"
                  className="font-medium"
                />

                <NumberInput
                  isRequired
                  label="Price"
                  labelPlacement="outside"
                  placeholder="0.00"
                  className="font-medium"
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
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AsyncSelection
                    data={(take) =>
                      take
                        ? (FetchCategory({
                            ty: "parent",
                            offset: take,
                            type: categorytype.normal,
                          }) as never)
                        : undefined
                    }
                    type="async"
                    option={{
                      name: "parent",
                      label: "Parent Categories",
                      size: "lg",
                      labelPlacement: "outside",
                      placeholder: "Select parent category",
                      selectedValue: product.category.parent.id
                        ? [`${product.category.parent.id}`]
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
                            } as ProductState)
                        );
                      },
                    }}
                  />

                  <AsyncSelection
                    type={product.category.parent.id ? "async" : "normal"}
                    forceRefetch={product.category.parent.id}
                    data={(take) =>
                      take
                        ? (FetchCategory({
                            ty: "child",
                            pid: product.category.parent.id,
                            offset: take,
                          }) as never)
                        : undefined
                    }
                    option={{
                      name: "child",
                      label: "Child Categories",
                      size: "lg",
                      selectedValue: product.category.child
                        ? [`${product.category.child.id}`]
                        : undefined,
                      isDisabled: !product.category.parent.id,
                      labelPlacement: "outside",
                      placeholder: "Select child category",
                      onChange: (e) =>
                        setproduct(
                          (prev) =>
                            ({
                              ...prev,
                              category: {
                                ...prev.category,
                                child: { id: Number(e.target.value) },
                              },
                            } as ProductState)
                        ),
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <StockCreateSection product={product} setproduct={setproduct} />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <ProductDetailCreateSection
                  product={product}
                  setproduct={setproduct}
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-lg font-semibold mb-3">
                  Related Products (Optional)
                </label>
                <SearchAndMultiSelect />
              </div>

              <div className="pt-6 flex gap-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  isDisabled={IsEdit ? isChange : false}
                  className="flex-1 py-3 font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  {IsEdit ? "Update Product" : "Create Product"}
                </Button>
                <Button
                  onPress={() => handleCancel()}
                  className="flex-1 py-3 font-semibold bg-red-400 hover:bg-red-500 text-white transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CreateProductPage;
