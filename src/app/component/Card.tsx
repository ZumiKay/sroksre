"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton, { Selection } from "./Button";
import "../globals.css";
import { Key, useState } from "react";
import ToggleMenu from "./ToggleMenu";
interface cardprops {
  name: string;
  price: string;
  img: string | StaticImageData;
  button?: boolean;
  Key?: Key | null | undefined;
}
export default function Card(props: cardprops) {
  const [state, setstate] = useState({
    detail: false,
  });
  return (
    <div key={props.Key} className="card__container w-[400px] h-[550px]">
      <div
        className="cardimage__container h-[80%] w-full"
        onMouseOver={() => setstate({ ...state, detail: true })}
        onMouseLeave={() => setstate({ ...state, detail: false })}
      >
        <Image
          className="card_img w-full h-full object-cover"
          src={props.img}
          alt="card_image"
        />

        <span className="relative bottom-[95%] left-[90%]">
          <i className="fa-solid fa-heart "></i>
        </span>
      </div>
      <section className="card_detail w-full h-[90px] font-semibold bg-white border-[0.5px] border-t-0 border-solid border-gray-400 pl-2 rounded-b-md text-sm">
        <h4 className="card_info w-[245px] h-[50px] overflow-auto">
          {" "}
          Fall Winter Jean for Women and men{" "}
        </h4>
        <h4 className="card_info"> Prices</h4>
      </section>
      {props.button && (
        <PrimaryButton type="button" text="Add To Cart" width={"100%"} />
      )}
    </div>
  );
}
interface SecondayCardprops {
  img: string | StaticImageData;
  width?: string;
  name?: string;
  price?: string;
  action?: boolean;
}
export function SecondayCard(props: SecondayCardprops) {
  return (
    <div className="w-full h-fit flex flex-col  items-end gap-y-5">
      <div
        style={{ width: props.width }}
        className="secondarycard__container flex flex-row items-center bg-[#F4FAFF] justify-between w-full gap-x-2"
      >
        <Image
          src={props.img}
          alt="cover"
          className="cardimage w-[250px] h-[350px] object-cover"
        />
        <div className="product_detail flex flex-col items-start gap-y-5 w-full">
          <div className="product_info">
            <h2 className="text-md font-black"> Product Name </h2>
            <h4>Price</h4>
          </div>
          <Selection default="Select" label="Size" data={["S", "M"]} />
          <label className="w-fit flex flex-row justify-between items-center gap-x-5">
            {" "}
            Quantity <input className="w-full border border-black rounded-md text-center" type="number" />{" "}
          </label>
          <ToggleMenu name="Product Details" />
          <i className="fa-solid fa-trash relative -top-2"></i>
        </div>
      </div>
      {props.action && (
        <div className="actions w-[75%] flex flex-row items-center justify-start gap-x-5">
          <PrimaryButton
            type="button"
            text="Returns"
            width="20%"
            height="30px"
            radius="5px"
            color="#0097FA"
            textcolor="white"
            hoverColor="black"
          />
          <PrimaryButton
            type="button"
            text="Delete"
            width="20%"
            height="30px"
            radius="5px"
            color="#F08080"
            textcolor="white"
            hoverColor="black"
          />
        </div>
      )}
    </div>
  );
}
