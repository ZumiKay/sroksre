import { CSSProperties, TouchEvent, useEffect, useState } from "react";
import "../globals.css";
import Image from "next/image";
import { ImageDatatype } from "@/src/context/GlobalType.type";

interface Primaryphotoprops {
  data: Array<ImageDatatype>;
  style?: CSSProperties;
  setclick?: React.Dispatch<React.SetStateAction<boolean>>;
  hover: boolean;
  showcount: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const PrimaryPhoto = (props: Primaryphotoprops) => {
  const [index, setIndex] = useState({
    start: 0,
    end: 0,
    current: 0,
  });
  // Track touch positions for swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setIndex({ ...index, end: props.data?.length - 1 });
  }, [index, props.data]);

  const handleClick = (pos: "left" | "right") => {
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
    setIndex({ ...index, current: newIndex });
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
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
      className="relative flex flex-col w-full h-full overflow-hidden items-center
                max-w-md md:max-w-xs"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{ transform: `translateX(-${index.current * 100}%)` }}
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
      >
        {props.data?.map((obj, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 h-full w-full flex items-center justify-center"
          >
            <Image
              src={obj.url}
              alt={obj.name || `Product image ${idx + 1}`}
              className="w-full h-full object-cover"
              width={400}
              height={550}
              quality={80}
              priority={idx === index.current}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows for desktop */}
      {!props.isMobile &&
        !props.isTablet &&
        props.hover &&
        props.data &&
        props.data.length > 1 && (
          <>
            <button
              className="absolute left-0 top-1/3 h-20 px-2 flex items-center justify-center
                      bg-transparent hover:bg-gray-200 hover:bg-opacity-40 transition-colors
                      rounded-r focus:outline-none group"
              onClick={() => handleClick("left")}
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              aria-label="Previous image"
            >
              <i className="fa-solid fa-chevron-left text-2xl text-black group-hover:text-gray-800"></i>
            </button>

            <button
              className="absolute right-0 top-1/3 h-20 px-2 flex items-center justify-center
                      bg-transparent hover:bg-gray-200 hover:bg-opacity-40 transition-colors
                      rounded-l focus:outline-none group"
              onClick={() => handleClick("right")}
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              aria-label="Next image"
            >
              <i className="fa-solid fa-chevron-right text-2xl text-black group-hover:text-gray-800"></i>
            </button>
          </>
        )}

      {/* Image counter */}
      {props.showcount && props.data?.length > 0 && (
        <div className="w-full bg-gray-700 text-white py-1 px-2 text-sm font-medium text-center">
          {index.current + 1} / {props.data.length}
        </div>
      )}
    </div>
  );
};
