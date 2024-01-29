import { CSSProperties, useEffect, useState } from "react";
import "../globals.css";
import Image from "next/image";

interface Primaryphotoprops {
  data: {
    url: string;
    name: string;
    type: string;
  }[];
  style?: CSSProperties;
  showcount: boolean;
}
type indextype = {
  start: number;
  end: number;
  current: number;
};

export const PrimaryPhoto = (props: Primaryphotoprops) => {
  const [index, setindex] = useState<indextype>({
    start: 0,
    end: 0,
    current: 0,
  });

  useEffect(() => {
    setindex({ ...index, end: props.data?.length - 1 });
  }, [props.data]);

  const handleClick = (pos: string) => {
    const { start, end, current } = index;

    let newIndex;
    if (end === -1) {
      return;
    }
    if (pos === "left") {
      // Decrement the index, wrap around if needed
      newIndex = current === start ? end : current - 1;
    } else {
      // Increment the index, wrap around if needed
      newIndex = current === end ? start : current + 1;
    }

    setindex({ ...index, current: newIndex });
  };
  return (
    <div
      style={props.style}
      className="primaryphoto__container flex flex-col gap-y-0  w-[400px] h-full overflow-hidden"
    >
      <div
        className="imagecontainer  flex flex-row justify-start items-center w-full h-full transition"
        style={{ transform: `translate(${-index.current * 100}% , 0)` }}
      >
        {props.data?.map((obj, index) => (
          <Image
            key={index}
            src={obj.url}
            alt={`${obj.name}`}
            className="min-w-[400px] min-h-[550px] object-contain"
            width={500}
            height={600}
            quality={80}
            loading="lazy"
          />
        ))}
      </div>
      <i
        onClick={() => handleClick("left")}
        className="fa-solid fa-chevron-left absolute top-[35%] left-1 w-fit h-fit pt-10 pb-10 pl-1 pr-1 transition  hover:bg-gray-300 text-3xl text-black"
      ></i>
      <i
        onClick={() => handleClick("right")}
        className="fa-solid fa-chevron-right absolute top-[35%] right-1  pt-10 pb-10 pl-1 pr-1 transition hover:bg-gray-300 text-3xl text-black"
      ></i>{" "}
      {props.showcount && (
        <p className="w-full text-center text-white bg-[#495464] p-1 text-sm font-bold">
          {" "}
          {props.data?.length > 0 ? index.current + 1 : index.current} /{" "}
          {props.data?.length}
        </p>
      )}
    </div>
  );
};
