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
  setclick?: React.Dispatch<React.SetStateAction<boolean>>;
  hover: boolean;
  showcount: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
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

  // Track touch positions for swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setindex({ ...index, end: props.data?.length - 1 });
  }, [props.data]);

  const handleClick = (pos: string) => {
    const { start, end, current } = index;
    if (end === -1) return;

    let newIndex = current;

    if (pos === "left") {
      // Decrement the index, wrap around if needed
      newIndex = current === start ? end : current - 1;
    } else {
      // Increment the index, wrap around if needed
      newIndex = current === end ? start : current + 1;
    }

    setindex({ ...index, current: newIndex });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;

    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleClick("right");
    } else if (distance < -minSwipeDistance) {
      handleClick("left");
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      style={props.style}
      className="primaryphoto__container flex flex-col gap-y-0 w-full
      max-smaller_screen:w-[400px] 
      max-large_tablet:w-[280px] 
      h-full 
      overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{ transform: `translateX(-${index.current * 100}%)` }}
        className="imagecontainer flex w-full h-full transition-transform duration-500 ease-in-out"
      >
        {props.data?.map((obj, idx) => {
          return (
            <div
              key={idx}
              className="flex-shrink-0 h-full w-full flex items-center justify-center"
            >
              <Image
                src={obj.url}
                alt={`${obj.name}`}
                className="w-[280px] h-[350px] object-contain"
                width={400}
                height={550}
                quality={80}
                priority={true}
              />
            </div>
          );
        })}
      </div>
      {!props.isMobile &&
        !props.isTablet &&
        props.hover &&
        props.data &&
        props.data.length > 1 && (
          <>
            <i
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              onClick={() => handleClick("left")}
              className="fa-solid fa-chevron-left absolute top-[30%] left-1 w-fit h-fit pt-10 pb-10 pl-1 pr-1 transition  hover:bg-gray-300 text-3xl text-black"
            ></i>
            <i
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              onClick={() => handleClick("right")}
              className="fa-solid fa-chevron-right absolute top-[30%] right-1  pt-10 pb-10 pl-1 pr-1 transition hover:bg-gray-300 text-3xl text-black"
            ></i>{" "}
          </>
        )}
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
