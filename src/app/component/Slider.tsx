"use client";

import Card from "./Card";
import Default from "../Asset/Image/default.png";
import "../globals.css";
import { EventHandler, MouseEvent, useEffect, useRef, useState } from "react";
interface sliderprops {
  name: string;
}
export default function SliderContainer(props: sliderprops) {
  const sliderref = useRef<HTMLDivElement>(null);
  let isHovered = false;
  useEffect(() => {
    isHovered = false;
    window.addEventListener("wheel", handleScroll);
    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);
  const handleScroll = (e: WheelEvent) => {
    if (sliderref.current) {
      e.preventDefault();
      if (isHovered) {
        sliderref.current.scrollLeft += e.deltaY;
      }
    }
  };
  const handleHover = () => {
    document.body.style.overflowY = "hidden";
    console.log("hover");
    isHovered = true;
  };
  const handleLeave = () => {
    console.log("Leave");
    document.body.style.overflowY = "auto";
    isHovered = false;
  };

  return (
    <div className="slider__container w-full h-fit flex flex-col justify-center ">
      <h1 className="slider_title bg-[#495464] p-3 text-xl font-bold text-white">
        {" "}
        {props.name}{" "}
      </h1>
      <div
        ref={sliderref}
        onMouseEnter={() => handleHover()}
        onMouseLeave={() => handleLeave()}
        className="slider_card__contianer max-w-[95vw] overflow-x-auto flex flex-row justify-start gap-x-10 scrollbar-hide "
      >
        {[1, 2, 3, 4, 9].map((i) => (
          <Card Key={i} name="Baggy T-shirt" price="100.00$" img={Default} />
        ))}
      </div>
    </div>
  );
}
