"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Input, Textarea } from "@heroui/react";
import PrimaryButton from "@/src/app/component/Button";
import { errorToast } from "@/src/app/component/Loading";
import { useGlobalContext } from "@/src/context/GlobalContext";

const inputClasses = {
  label: "text-sm font-semibold text-gray-700",
  input: "text-base",
  inputWrapper:
    "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors",
};

const normalDetailInitial = { info_title: "", info_value: "" };

const NormalDetail = () => {
  const { product, globalindex, setproduct, setglobalindex, setopenmodal } =
    useGlobalContext();
  const [index, setindex] = useState(-1);
  const [normaldetail, setnormal] = useState(normalDetailInitial);

  useEffect(() => {
    const isEdit = globalindex.productdetailindex !== -1;
    if (isEdit) {
      setnormal({
        info_title: product.details[globalindex.productdetailindex].info_title,
        info_value: product.details[globalindex.productdetailindex]
          .info_value[0] as string,
      });
    }
    setindex(globalindex.productdetailindex);
  }, [globalindex.productdetailindex]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setnormal((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    const updatedetail = [...product.details];
    const isExist = updatedetail.some(
      (obj, idx) => idx !== index && obj.info_title === normaldetail.info_title,
    );
    if (isExist) {
      errorToast("Name Already Exist");
      return;
    }

    if (index === -1) {
      updatedetail.push({
        info_title: normaldetail.info_title,
        info_type: "NORMAL",
        info_value: [normaldetail.info_value],
      });
    } else {
      updatedetail[index].info_title = normaldetail.info_title;
      updatedetail[index].info_value[0] = normaldetail.info_value;
      updatedetail[index].info_type = "NORMAL";
    }

    setproduct({ ...product, details: updatedetail });
    setglobalindex((prev) => ({ ...prev, productdetailindex: -1 }));
    setnormal(normalDetailInitial);
    setopenmodal((prev) => ({ ...prev, productdetail: false }));
  };

  return (
    <div
      className="normalDetail w-full sm:w-[90%] md:w-[85%] lg:w-[80%] 
      h-full flex flex-col justify-center gap-y-4 sm:gap-y-5 
      bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200"
    >
      <Input
        type="text"
        name="info_title"
        label="Title"
        value={normaldetail.info_title}
        onChange={handleChange}
        size="lg"
        variant="bordered"
        placeholder="Enter detail title"
        classNames={inputClasses}
      />
      <Textarea
        value={normaldetail.info_value}
        size="lg"
        label="Description"
        onChange={handleChange}
        name="info_value"
        variant="bordered"
        placeholder="Enter detail description"
        minRows={4}
        classNames={{
          ...inputClasses,
          inputWrapper: inputClasses.inputWrapper + " min-h-[120px]",
        }}
      />
      <PrimaryButton
        onClick={handleAdd}
        type="button"
        text="Add Detail"
        color="#35C191"
        radius="10px"
        width="100%"
        height="50px"
        disable={
          normaldetail.info_value.length === 0 ||
          normaldetail.info_title.length === 0
        }
      />
    </div>
  );
};

export const DetailsModal = () => {
  const { setopenmodal } = useGlobalContext();

  return (
    <div
      className="details_modal bg-linear-to-br from-blue-100 via-indigo-100 to-purple-100 
      w-full h-full flex flex-col gap-y-5 items-center 
      px-3 sm:px-4 md:px-6 py-5 sm:py-6 md:py-8 rounded-xl shadow-inner border border-blue-200"
    >
      <NormalDetail />
      <PrimaryButton
        width="80%"
        height="50px"
        radius="10px"
        text="Back"
        onClick={() => setopenmodal((prev) => ({ ...prev, productdetail: false }))}
        color="#CE9EAD"
        type="button"
      />
    </div>
  );
};
