import { SelectType } from "@/src/context/GlobalType.type";
import { InventoryInfoType, StockType } from "../../inventory.type";
import { AsyncSelection } from "@/src/app/component/AsynSelection";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  Button,
  Divider,
  Form,
  Input,
  NumberInput,
  Textarea,
} from "@heroui/react";
import { VariantIcon } from "@/src/app/component/Asset";
import ToggleMenu from "@/src/app/component/ToggleMenu";
import React, { FormEvent } from "react";
import { errorToast } from "@/src/app/component/Loading";
import PrimaryButton from "@/src/app/component/Button";

const StockOption: Array<SelectType> = [
  { label: "Normal", value: StockType.Stock },
  {
    label: "Variant",
    value: StockType.Variant,
  },
];

export const StockCreateSection = () => {
  const { product, setproduct, globalindex, setopenmodal } = useGlobalContext();

  function handleChange<t>(name: string, val: t) {
    setproduct((prev) => ({ ...prev, [name]: val }));
  }

  return (
    <div className="stock_section w-full h-fit flex flex-col gap-y-5">
      <h3 className="text-lg font-bold">Stock Section</h3>
      <Divider />
      <AsyncSelection
        type="normal"
        data={() => StockOption}
        option={{
          onChange: ({ target }) => handleChange(target.name, target.value),
          name: "stocktype",
          size: "lg",
          selectedKeys: [product.stocktype],
          value: product.stocktype,
          placeholder: "Stock Type",
          isRequired: true,
          errorMessage: "Stock Type is Required",
        }}
      />
      {product.stocktype === StockType.Stock ? (
        <NumberInput
          name="stock"
          value={product.stock}
          label="Stock"
          size="lg"
          className="font-bold"
          labelPlacement="outside"
          errorMessage="Stock is required"
          isRequired
          onValueChange={(val) => handleChange("stock", val)}
        />
      ) : product.stocktype === StockType.Variant ? (
        <Button
          className="w-full h-[40px] font-bold bg-blue-300"
          startContent={<VariantIcon />}
          onPress={() => setopenmodal({ addproductvariant: true })}
        >
          {globalindex.producteditindex === -1 ? "Create" : "Edit"} Variant
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
};

const initialDetail = {
  info_title: "",
  info_value: "",
};
const DetailsModal = () => {
  const { setopenmodal, product, globalindex, setproduct, setglobalindex } =
    useGlobalContext();
  const [normaldetail, setNormalDetail] = React.useState(initialDetail);
  const [index, setIndex] = React.useState(-1);

  React.useEffect(() => {
    const { productdetailindex } = globalindex;
    const isEditing = productdetailindex !== -1;

    if (isEditing) {
      const detail = product.details[productdetailindex];
      setNormalDetail({
        info_title: detail.info_title,
        info_value: detail.info_value[0] as string,
      });
    }

    setIndex(productdetailindex);
  }, [globalindex.productdetailindex, product.details]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNormalDetail((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    const details = [...product.details];
    const isDuplicate = details.some(
      (detail, idx) =>
        idx !== index && detail.info_title === normaldetail.info_title
    );

    if (isDuplicate) {
      errorToast("Name Already Exist");
      return;
    }

    const newDetail = {
      info_title: normaldetail.info_title,
      info_type: InventoryInfoType.Text,
      info_value: [normaldetail.info_value],
    };

    if (index === -1) {
      details.push(newDetail);
    } else {
      details[index] = { ...details[index], ...newDetail };
    }

    setproduct({ ...product, details });
    setNormalDetail(initialDetail);
    setglobalindex((prev) => ({ ...prev, productdetailindex: -1 }));
    setopenmodal((prev) => ({ ...prev, productdetail: false }));
  };

  const isButtonDisabled = !normaldetail.info_title || !normaldetail.info_value;

  return (
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 items-center pr-1 pl-1 pt-5 pb-5">
      <div className="normalDetail w-full h-full flex flex-col justify-center gap-y-5 p-3">
        <Input
          type="text"
          name="info_title"
          label="Title"
          value={normaldetail.info_title}
          onChange={handleChange}
          className="detailname w-full rounded-md text-center text-lg"
          size="lg"
        />

        <Textarea
          value={normaldetail.info_value}
          size="lg"
          className="w-full min-h-[100px] h-fit text-lg text-left overflow-y-auto rounded-lg"
          label="Description"
          onChange={handleChange}
          name="info_value"
        />
      </div>

      <div className="w-[90%] flex flex-row justify-between items-center gap-x-5">
        <Button
          isDisabled={isButtonDisabled}
          className="font-bold w-full text-white bg-green-300"
          onPress={() => handleAdd()}
        >
          Add Detail
        </Button>
        <Button
          className="font-bold w-full text-white bg-red-300"
          onPress={() => setopenmodal({ productdetail: false })}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export const ProductDetailCreateSection = () => {
  const { product, openmodal, setopenmodal } = useGlobalContext();

  return (
    <div className="product_detail w-full h-fit flex flex-col gap-y-5">
      <ToggleMenu
        name="Product Details"
        data={product.details}
        isAdmin={true}
      />
      {!openmodal.productdetail ? (
        <Button
          onPress={() => setopenmodal({ productdetail: true })}
          className="w-full bg_default text-white font-bold h-[40px]"
        >
          Add Detail
        </Button>
      ) : (
        <div className="w-full h-full">
          <DetailsModal />
        </div>
      )}
    </div>
  );
};
