"use client";

import Card from "./Card";
import "../globals.css";

interface sliderprops {
  name: string;
}
export default function SliderContainer(props: sliderprops) {
  return (
    <div className="slider__container w-full h-[50vh] flex flex-col justify-center ">
      <h1 className="slider_title bg-[#495464] p-3 text-xl font-bold text-white">
        {" "}
        {props.name}{" "}
      </h1>
      <div className="slider_card__contianer max-w-[95vw] overflow-x-auto overflow-y-hidden flex flex-row justify-start gap-x-10 scrollbar-hide"></div>
    </div>
  );
}
