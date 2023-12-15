"use client";
import Image from "next/image";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import CloseIcon from "../Asset/Image/Close.svg";
import TinyColor from "tinycolor2";
import PrimaryButton, { InputFileUpload, Selection } from "./Button";
import "../globals.css";
import ToggleMenu from "./ToggleMenu";
import { DefaultSize, useGlobalContext } from "@/src/context/GlobalContext";
import { INVENTORYENUM } from "../dashboard/products/page";
import { PrimaryPhoto } from "./PhotoComponent";

export default function Modal({ children }: { children: ReactNode }) {
  return (
    <dialog className="modal__container z-[100] fixed flex flex-col items-center justify-center left-0 top-0 w-full h-screen backdrop-blur-md">
      {children}
    </dialog>
  );
}

export function CreateProducts() {
  const { openmodal, setopenmodal, product, setproduct } = useGlobalContext();
  const [edit, setedit] = useState({
    productdetail: false,
  });
  const [productcover, setproductcover] = useState<File[]>([]);
  const [show, setshow] = useState({
    size: false,
    productdetail: false,
    uploadImg: false,
  });
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  const IsAdded = (type: string) => {
    const foundItem = product.details.find((item) => item.info_type === type);

    if (foundItem) {
      return { added: true, index: product.details.indexOf(foundItem) };
    } else {
      return { added: false, index: -1 };
    }
  };
  return (
    <dialog
      open={openmodal.createProduct}
      className="createProduct__container z-[100] flex items-center fixed top-0 left-0 bg-white h-screen w-screen"
    >
      <form
        onSubmit={handleSubmit}
        className="createform flex flex-col w-full items-center justify-center gap-y-5"
      >
        <div className="product__form w-[100%] flex flex-row gap-x-16 max-h-[550px] overflow-y-auto items-start justify-center">
          <div className="image__contianer sticky top-0 w-fit h-fit">
            <PrimaryPhoto
              data={
                product.cover.length > 1
                  ? product.cover
                  : [
                      "https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg?w=2000",
                      "https://i.pinimg.com/564x/dd/8b/05/dd8b050d5ba58b21dab8c39471a34f6f.jpg",
                      "https://i.pinimg.com/564x/0d/a1/12/0da112537939b3265145dc9293b069fd.jpg",
                    ]
              }
            />
            <PrimaryButton
              type="button"
              text={product.cover.length > 1 ? "Edit Photo" : "Upload Photo"}
              width="100%"
              onClick={() => {
                setshow({ ...show, uploadImg: true });
              }}
              Icon={<i className="fa-regular fa-image text-lg text-white"></i>}
            />
            {show.uploadImg && (
              <ImageUpload
                coverfile={productcover}
                setcoverfile={setproductcover}
                open={show.uploadImg}
                setopen={setshow}
              />
            )}
          </div>
          <div className="productinfo flex flex-col justify-center items-end w-1/2 h-fit gap-y-5">
            <input
              type="text"
              placeholder="ProductName"
              name="name"
              required
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />
            <input
              type="text"
              placeholder="Price"
              name="price"
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />
            <input
              type="number"
              placeholder="Stock"
              name="stock"
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />
            {IsAdded(INVENTORYENUM.size).added && (
              <Selection
                default="Select"
                data={
                  product.details[IsAdded(INVENTORYENUM.size).index].info_value
                }
              />
            )}
            {IsAdded(INVENTORYENUM.size).added ? (
              <Sizecontainer index={IsAdded(INVENTORYENUM.size).index} />
            ) : (
              <PrimaryButton
                radius="10px"
                textcolor="black"
                Icon={<i className="fa-regular fa-square-plus text-2xl"></i>}
                type="button"
                text="Add product size"
                width="100%"
                onClick={() => {
                  let updatearr = [...product.details];
                  updatearr.push({
                    info_title: INVENTORYENUM.size,
                    info_value: DefaultSize,
                    info_type: INVENTORYENUM.size,
                  });
                  setproduct({ ...product, details: updatearr });
                }}
                height="50px"
                color="#D9D9D9"
              />
            )}
            <div
              onClick={() => {
                setedit({ ...edit, productdetail: !edit.productdetail });
              }}
              className={`toggleMenu_section w-full h-fit p-1 transition cursor-pointer rounded-md  hover:border border-gray-400`}
              style={{
                border: edit.productdetail ? "1px solid black" : "",
              }}
            >
              <ToggleMenu name="Product Details" data={product.details} />
            </div>
            {!openmodal.productdetail ? (
              <PrimaryButton
                color="#0097FA"
                text="Add more detail"
                onClick={() => {
                  setopenmodal({ ...openmodal, productdetail: true });
                }}
                type="button"
                radius="10px"
                width="100%"
                height="50px"
              />
            ) : (
              <DetailsModal
                isEdit={edit.productdetail}
                isAdded={IsAdded}
                open={show}
                setopen={setshow}
              />
            )}
          </div>
        </div>
        <PrimaryButton
          color="#44C3A0"
          text="CREATE"
          type="submit"
          radius="10px"
          width="70%"
          height="50px"
        />{" "}
        <PrimaryButton
          color="#F08080"
          text="CANCEL"
          type="button"
          radius="10px"
          width="70%"
          height="50px"
          onClick={() => setopenmodal({ ...openmodal, createProduct: false })}
        />
      </form>
    </dialog>
  );
}
interface SizecontainerProps {
  index: number;
}

const Sizecontainer = (props: SizecontainerProps) => {
  const [customvalue, setvalue] = useState("");
  const { product, setproduct } = useGlobalContext();
  const allsize = product.details[props.index].info_value;
  const handleAdd = () => {
    if (customvalue !== "") {
      const prevarr = [...allsize];
      const detail = [...product.details];
      const isExist = prevarr.find(
        (i) => i.toLowerCase() === customvalue.toLowerCase(),
      );
      if (isExist) {
        alert("Size Existed");
      } else {
        prevarr.push(customvalue);
        detail[props.index].info_value = prevarr;
        setproduct({ ...product, details: detail });
        setvalue("");
      }
    }
  };
  const handleDelete = (index: number) => {
    const updatearr = [...allsize];
    const detail = [...product.details];

    updatearr.splice(index, 1);
    detail[props.index].info_value = updatearr;
    setproduct({ ...product, details: detail });
  };

  const SizeElement = (props: { value: string; id: number }) => {
    return (
      <div
        key={props.id}
        className="size flex flex-row justify-center bg-gray-300 w-[100px]  p-2 h-fit rounded-lg text-center font-bold"
      >
        <span
          onClick={() => handleDelete(props.id)}
          className="relative -top-5 left-[100%] transition hover:-translate-y-1"
        >
          <i className="fa-solid fa-minus font-bold text-white  text-[10px] bg-[#F08080] rounded-2xl p-1"></i>
        </span>

        <h3 className={`relative w-full break-words right-2`}>{props.value}</h3>
      </div>
    );
  };
  return (
    <div className="size__contianer w-full h-fit flex flex-col gap-y-5">
      <div className="size_list grid grid-cols-4 w-fit gap-x-5 gap-y-5 h-full">
        {allsize.map((i) => (
          <SizeElement value={i} id={allsize.indexOf(i)} />
        ))}
      </div>

      <input
        type="text"
        placeholder="Custom Size"
        name="size"
        value={customvalue}
        onChange={(e) => setvalue(e.target.value)}
        className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
      />
      {customvalue !== "" && (
        <PrimaryButton
          color="#44C3A0"
          text="Add"
          type="button"
          radius="10px"
          onClick={() => handleAdd()}
          width="100%"
          height="50px"
        />
      )}

      <PrimaryButton
        color="#F08080"
        text="Delete"
        onClick={() => {
          let updatearr = [...product.details];
          updatearr.splice(props.index, 1);
          setproduct({ ...product, details: updatearr });
        }}
        type="button"
        radius="10px"
        width="100%"
        height="50px"
      />
    </div>
  );
};

export const DetailsModal = (props: {
  open: any;
  isEdit: boolean;
  setopen: any;
  isAdded: (type: string) => {
    added: boolean;
    index: number;
  };
}) => {
  const {
    product,
    setproduct,
    openmodal,
    setopenmodal,
    globalindex,
    setglobalindex,
  } = useGlobalContext();

  const alltype = [INVENTORYENUM.normal, INVENTORYENUM.color];
  const [index, setindex] = useState(0);
  const [type, settype] = useState("");
  useEffect(() => {
    const idx = globalindex.productdetailindex;
    if (idx !== -1) {
      settype(product.details[idx].info_type);
    }
  }, [globalindex]);

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    let newDetail = [...product.details];
    let value = e.target.value;
    newDetail.push({
      info_type: value,
      info_value: [""],
      info_title: "",
    });
    setproduct({ ...product, details: newDetail });
    settype(e.target.value);
    setindex(newDetail.length - 1);
  };

  const ChoseType = () => {
    return (
      <div className="type_container w-full h-fit flex flex-col items-center gap-y-5">
        <h3 className="text-xl font-bold">Choose Type Of Details</h3>
        <Selection
          data={alltype}
          onChange={handleSelect}
          default="TYPE"
          style={{ width: "100%", height: "50px" }}
        />
      </div>
    );
  };

  return (
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 p-14">
      {type === INVENTORYENUM.normal ? (
        <NormalDetail
          open={props.open}
          setopen={props.setopen}
          index={
            globalindex.productdetailindex === -1
              ? index
              : globalindex.productdetailindex
          }
        />
      ) : type === INVENTORYENUM.color ? (
        <Color
          index={
            globalindex.productdetailindex === -1
              ? index
              : globalindex.productdetailindex
          }
        />
      ) : (
        <ChoseType />
      )}

      <PrimaryButton
        width="100%"
        height="50px"
        radius="10px"
        text="Back"
        onClick={() => {
          const updatedDetails = [...product.details];
          if (globalindex.productdetailindex !== -1) {
            setglobalindex({ ...globalindex, productdetailindex: -1 });
            setopenmodal({ ...openmodal, productdetail: false });
          } else {
            if (type !== "") {
              const currentInfoTitle = updatedDetails[index].info_title;

              if (currentInfoTitle === "") {
                updatedDetails.splice(index, 1);
                setproduct({ ...product, details: updatedDetails });
              }
              settype("");
            }
            if (type === "") {
              setopenmodal({ ...openmodal, productdetail: false });
            }
          }
        }}
        color="#CE9EAD"
        type="button"
      />
    </div>
  );
};

export const Category = () => {
  const { openmodal, setopenmodal, category, setcategory } = useGlobalContext();
  const [data, setdata] = useState({
    name: "",
    gender: "",
  });
  const allgender = ["Men", "Women"];
  const handleAdd = () => {
    const updatecategory = [...category];
    updatecategory.push(data);
    alert("Category Added");
  };
  return (
    <div className="category rounded-md p-2 w-1/2 h-1/2 flex flex-col bg-white gap-y-5 justify-center items-start">
      <input
        placeholder="name"
        onChange={(e) => setdata({ ...data, name: e.target.value })}
        type="text"
        name="categoryname"
        className="name w-full h-[50px] text-lg font-bold border border-gray-400 pl-1 rounded-md bg-white"
      />
      <Selection
        onChange={(e) => setdata({ ...data, gender: e.target.value })}
        style={{ height: "50px" }}
        default="Select Gender (Optional)"
        data={allgender}
      />
      <PrimaryButton
        width="100%"
        height="50px"
        radius="10px"
        onClick={() => handleAdd()}
        text="Add Category"
        color="#35C191"
        type="button"
      />
      <PrimaryButton
        width="100%"
        height="50px"
        radius="10px"
        text="Cancel"
        onClick={() => setopenmodal({ ...openmodal, createCategory: false })}
        color="#CE9EAD"
        type="button"
      />
    </div>
  );
};

interface normaldetailprops {
  index: number;
  open: any;
  setopen: any;
}
const NormalDetail = (props: normaldetailprops) => {
  const { product, setproduct, globalindex } = useGlobalContext();
  const [normaldetail, setnormal] = useState({
    info_title: "",
    info_value: "",
  });
  useEffect(() => {
    const editindex = globalindex.productdetailindex === -1;
    if (!editindex) {
      setnormal({
        info_title: product.details[globalindex.productdetailindex].info_title,
        info_value:
          product.details[globalindex.productdetailindex].info_value[0],
      });
    }
  }, [globalindex]);
  const handleAdd = () => {
    const updatedetail = [...product.details];
    const isExist = updatedetail.some(
      (obj) => obj.info_title === normaldetail.info_title,
    );
    if (isExist) {
      alert("Name Already Exist");
      return;
    }
    updatedetail[props.index].info_title = normaldetail.info_title;
    updatedetail[props.index].info_value[0] = normaldetail.info_value;
    updatedetail[props.index].info_type = INVENTORYENUM.normal;
    setproduct({ ...product, details: updatedetail });
    setnormal({ info_value: "", info_title: "" });
    //save detail
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setnormal({ ...normaldetail, [e.target.name]: e.target.value });
  };

  return (
    <div className="normalDetail w-full h-full flex flex-col justify-center gap-y-5">
      <input
        type="text"
        name="info_title"
        value={normaldetail.info_title}
        placeholder="Name"
        onChange={handleChange}
        className="detailname w-full rounded-md h-[50px] text-center text-lg"
      />
      <textarea
        value={normaldetail.info_value}
        className="w-full min-h-[50px] max-h-[100px] text-center overflow-y-auto"
        placeholder="Description"
        onChange={handleChange}
        name="info_value"
      />
      <PrimaryButton
        onClick={() => handleAdd()}
        type="button"
        text="Add Detail"
        color="#35C191"
        radius="10px"
        width="100%"
        height="50px"
        disable={
          normaldetail.info_value.length < 1 ||
          normaldetail.info_title.length < 1
        }
      />
    </div>
  );
};

const Color = (props: { index: number }) => {
  const { product, setproduct, globalindex } = useGlobalContext();
  const [index, setindex] = useState(0);
  const [colorvalue, setvalue] = useState({
    value: "",
    title: "Color",
  });
  const [colorvalueedit, setedit] = useState([
    {
      isEdit: false,
      value: "",
    },
  ]);
  useEffect(() => {
    setindex(
      globalindex.productdetailindex !== -1
        ? globalindex.productdetailindex
        : props.index,
    );
  }, [globalindex]);
  const isvalidColor = (hex: string) => {
    const color = TinyColor(hex);
    return color.isValid();
  };
  function isValidHexCode(hexCode: string) {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(hexCode);
  }
  const handleConfirm = () => {
    let value = colorvalue.value;
    let updatecolor = [...product.details];
    let updatevalue = [...colorvalueedit];
    const isExist = updatecolor.some(
      (obj, idx) => idx !== index && obj.info_title === colorvalue.title,
    );

    if (isExist) {
      alert("Name Already Existed");
      return;
    }

    updatecolor[index].info_title = colorvalue.title;
    if (isvalidColor(value) && isValidHexCode(value)) {
      let editing = { isEdit: false, index: 0 };
      updatevalue.forEach((obj, i) => {
        if (obj.isEdit) {
          editing.isEdit = true;
          editing.index = i;
        }
      });
      if (editing.isEdit) {
        let indexvalue = updatevalue[editing.index];
        indexvalue.isEdit = false;
        indexvalue.value = value;
        updatecolor[index].info_value[editing.index] = value;
      } else {
        updatevalue.push({
          isEdit: false,
          value: value,
        });
        updatecolor[index].info_value.push(value);
      }
      setedit(updatevalue);
      setvalue({ ...colorvalue, value: "" });
      setproduct({ ...product, details: updatecolor });
    } else {
      alert("Invalid HexCode");
    }
  };

  const handleEdit = (index: number) => {
    const updatevalue = [...colorvalueedit];
    const updatedArray = updatevalue.map((obj, i) => ({
      ...obj,
      isEdit: obj.isEdit ? false : i === index,
    }));
    setedit(updatedArray);
    setvalue({
      ...colorvalue,
      value:
        colorvalue.value === updatevalue[index].value
          ? ""
          : updatevalue[index].value,
    });
  };
  const handleDelete = (index: number) => {
    //delete Color
    const updatecolor = [...product.details];
    const updatetemp = [...colorvalueedit];
    const deletecolor = updatecolor[index].info_value;
    deletecolor.splice(index, 1);
    updatetemp.splice(index, 1);
    setproduct({ ...product, details: updatecolor });
    setedit(updatetemp);
    setvalue({ ...colorvalue, value: "" });
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setvalue({ ...colorvalue, [e.target.name]: e.target.value });
  };

  return (
    <div className="color_form w-full h-full flex flex-col items-center justify-center gap-y-5">
      <input
        placeholder="Color Hexcode ex. #00000"
        type="text"
        name="value"
        value={colorvalue.value}
        onChange={handleChange}
        className="name w-full h-[50px] pl-2 text-lg font-bold rounded-md bg-white"
      />
      <input
        placeholder="Name"
        type="text"
        name="title"
        value={colorvalue.title}
        onChange={handleChange}
        className="name w-full h-[50px] pl-2 text-lg font-bold rounded-md bg-white"
      />

      <div className="colorlist w-full h-fit grid grid-cols-5 place-content-center gap-x-10 gap-y-5">
        {product.details[props.index].info_value
          .filter((i) => i.length > 0)
          .map((hex, index) => (
            <div className="w-full h-fit flex flex-row">
              <div
                key={index}
                onClick={() => handleEdit(index + 1)}
                className={`colorcircle ${
                  colorvalueedit[index + 1]?.isEdit ? "colorcircleactive" : ""
                } w-[50px] h-[50px] rounded-3xl`}
                style={{ backgroundColor: `${hex}` }}
              ></div>
              <i
                onClick={() => handleDelete(index + 1)}
                className="fa-solid fa-minus p-[1px] h-fit relative left-1 text-sm rounded-lg bg-red-500 text-white transition hover:-translate-y-2 active:-translate-y-2"
              ></i>
            </div>
          ))}
      </div>
      <PrimaryButton
        type="button"
        text="ADD"
        onClick={() => handleConfirm()}
        width="100%"
        height="50px"
        color="#4688A0"
        radius="10px"
        disable={colorvalue.value === "" || colorvalue.title === ""}
      />
    </div>
  );
};

interface imageuploadprops {
  open: boolean;
  setopen: any;
  coverfile: File[];
  setcoverfile: Dispatch<SetStateAction<File[]>>;
}
export const ImageUpload = (props: imageuploadprops) => {
  const { product, setproduct } = useGlobalContext();
  const [Imgfile, setfile] = useState<File[]>(
    props.coverfile.length > 0 ? props.coverfile : [],
  );
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    if (selectedFile) {
      const filesArray = Array.from(selectedFile);
      const allowedFileType = ["image/jpeg", "image/png", "image/svg+xml"];
      if (Imgfile.length + filesArray.length > 4) {
        alert("Can only upload 4 images");
        return;
      }
      const filteredFile = filesArray.filter((file) =>
        allowedFileType.includes(file.type),
      );
      filesArray.map((i) => console.log("filetype", i.type));

      setfile([...Imgfile, ...filteredFile]);
    }
  };
  const handleDelete = (index: number) => {
    const updateFiles = [...Imgfile];
    updateFiles.splice(index, 1);
    setfile(updateFiles);
  };
  const filetourl = (file: File[]) => {
    let url = [""];
    file.map((obj) => url.push(URL.createObjectURL(obj)));
    return url.filter((i) => i !== "");
  };
  const handleSave = () => {
    const urls = filetourl(Imgfile);
    props.setcoverfile(Imgfile);

    setproduct({ ...product, cover: urls });
    alert("File Save");
    //save to google firebase
    //return as link to save in products database sperate by cgoogle firebase
    //return as link to save in products database sperate by commas
  };
  return (
    <dialog
      open={props.open}
      className="Uploadimagemodal fixed w-screen h-screen flex flex-col items-center justify-center top-0 left-0 z-[120] bg-white"
    >
      <Image
        src={CloseIcon}
        alt="close"
        onClick={() => {
          setfile([]);
          props.setopen((prev: any) => ({ ...prev, uploadImg: false }));
        }}
        className="w-[50px] h-[50px] absolute top-5 right-10 object-contain transition hover:-translate-y-2 active:-translate-y-2"
      />
      <div className="uploadImage__container w-[80%] max-h-[600px] flex flex-row justify-start items-center gap-x-5">
        <div className="previewImage__container w-[50%] border-[1px] border-black grid grid-cols-2 gap-x-5 p-3  min-h-[400px] max-h-[500px] overflow-y-auto">
          {Imgfile.map((file, index) => (
            <div key={index} className="image_container">
              <Image
                className={`w-[250px] h-[350px] ${
                  file.type === "image/svg+xml" ? "object-fill" : "object-cover"
                }`}
                src={URL.createObjectURL(file)}
                alt={`Preview of ${file.name}`}
                width={250}
                height={350}
              />
              <i
                onClick={() => handleDelete(index)}
                className="fa-solid fa-minus font-black p-[1px] h-fit relative -top-[95%] left-[80%] text-sm rounded-lg bg-red-500 text-white transition hover:-translate-y-2 active:-translate-y-2"
              ></i>
            </div>
          ))}
        </div>
        <div className="action__container w-1/2 flex flex-col items-center gap-y-5 h-fit">
          <InputFileUpload onChange={handleFile} />
          <PrimaryButton
            onClick={() => handleSave()}
            type="button"
            text="SAVE"
            width="100%"
            height="50px"
            color="#44C3A0"
            radius="10px"
          />
        </div>
      </div>
    </dialog>
  );
};
