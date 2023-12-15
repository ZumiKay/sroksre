import { useEffect, useState } from "react";
import "../globals.css";

interface Primaryphotoprops {
  data: string[];
}

export const PrimaryPhoto = (props: Primaryphotoprops) => {
  const [index, setindex] = useState({
    start: 0,
    end: 0,
    current: 0,
  });
  useEffect(() => {
    setindex({ ...index, end: props.data.length - 1 });
  }, [props.data]);

  const handleClick = (pos: string) => {
    const { start, end, current } = index;

    const newIndex =
      pos === "left"
        ? ((current - 1 + end - start) % (end - start + 1)) + start
        : ((current + 1 - start) % (end - start + 1)) + start;

    setindex({ ...index, current: newIndex });
  };
  return (
    <div className="primaryphoto__container w-[350px] h-[500px] overflow-hidden">
      <i
        onClick={() => handleClick("left")}
        className="fa-solid fa-chevron-left w-fit h-fit pt-10 pb-10 pl-1 pr-1 transition  hover:bg-gray-300 absolute -left-10 top-[20vh] text-3xl text-black"
      ></i>
      <i
        onClick={() => handleClick("right")}
        className="fa-solid fa-chevron-right absolute -right-10 top-[20vh] pt-10 pb-10 pl-1 pr-1 transition hover:bg-gray-300 text-3xl text-black"
      ></i>
      <div
        className="imagecontainer flex flex-row justify-start items-center gap-x-5 bg-black w-screen h-[90%] transition"
        style={{ transform: `translate(${-index.current * 19.28}% , 0)` }}
      >
        {props.data.map((obj, index) => (
          <img
            key={index}
            src={obj}
            alt="cover"
            className="w-[350px] h-full object-cover"
          />
        ))}
      </div>

      <p className="w-full text-center text-lg font-bold">
        {" "}
        {index.current + 1} / {props.data.length}{" "}
      </p>
    </div>
  );
};
