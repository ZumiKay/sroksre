import { CSSProperties, memo, TouchEvent, useEffect, useState } from "react";
import "../globals.css";
import Image from "next/image";
import { ImageDatatype } from "@/src/context/GlobalType.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

interface Primaryphotoprops {
  data: Array<ImageDatatype>;
  style?: CSSProperties;
  setclick?: React.Dispatch<React.SetStateAction<boolean>>;
  hover: boolean;
  showcount: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const PrimaryPhoto = memo((props: Primaryphotoprops) => {
  const [index, setIndex] = useState({
    start: 0,
    end: 0,
    current: 0,
  });
  // Track touch positions for swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Animation state
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (props.data?.length) {
      setIndex({ ...index, end: props.data.length - 1 });
    }
  }, [props.data?.length]);

  const handleClick = (pos: "left" | "right") => {
    const { start, end, current } = index;
    if (end === -1) return;

    setDirection(pos);

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

  const currentImage = props.data?.[index.current];
  const hasMultipleImages = props.data && props.data.length > 1;

  return (
    <div
      style={props.style}
      className="relative overflow-hidden rounded-lg shadow-md bg-white w-full h-full
                max-w-md md:max-w-xs group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image gallery */}
      <div className="w-full h-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index.current}
            initial={{
              opacity: 0,
              x: direction === "right" ? 20 : -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { duration: 0.3 },
            }}
            exit={{
              opacity: 0,
              x: direction === "right" ? -20 : 20,
              transition: { duration: 0.2 },
            }}
            className="w-full h-full"
          >
            {currentImage && (
              <div className="relative w-full h-full">
                {/* Loading skeleton */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse">
                    <div className="flex items-center justify-center h-full">
                      <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    </div>
                  </div>
                )}

                <Image
                  src={currentImage.url}
                  alt={
                    currentImage.name || `Product image ${index.current + 1}`
                  }
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  width={400}
                  height={550}
                  quality={90}
                  priority={index.current === 0}
                  onLoadingComplete={() => setIsImageLoaded(true)}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows - visible on hover for desktop and always for mobile */}
      {hasMultipleImages &&
        (props.hover || props.isMobile || props.isTablet) && (
          <>
            <div
              className={`absolute inset-x-0 inset-y-0 flex items-center justify-between 
                          px-2 sm:px-4 opacity-0 group-hover:opacity-100 transition-opacity 
                          duration-300 ${props.isMobile ? "opacity-100" : ""}`}
            >
              <button
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 backdrop-blur-sm
                        shadow-md flex items-center justify-center
                        transform transition-transform duration-300 hover:scale-110 focus:scale-110
                        focus:outline-none active:scale-95"
                onClick={() => handleClick("left")}
                onMouseEnter={() => props.setclick && props.setclick(true)}
                onMouseLeave={() => props.setclick && props.setclick(false)}
                aria-label="Previous image"
                type="button"
              >
                <FontAwesomeIcon
                  className="text-gray-800 text-lg sm:text-xl"
                  icon={faChevronLeft}
                />
              </button>

              <button
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 backdrop-blur-sm
                        shadow-md flex items-center justify-center
                        transform transition-transform duration-300 hover:scale-110 focus:scale-110
                        focus:outline-none active:scale-95"
                onClick={() => handleClick("right")}
                onMouseEnter={() => props.setclick && props.setclick(true)}
                onMouseLeave={() => props.setclick && props.setclick(false)}
                aria-label="Next image"
                type="button"
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-800 text-lg sm:text-xl"
                />
              </button>
            </div>
          </>
        )}

      {/* Image counter with enhanced design */}
      {props.showcount && hasMultipleImages && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <div
            className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white 
                        text-xs font-medium tracking-wider"
          >
            {index.current + 1} / {props.data.length}
          </div>
        </div>
      )}

      {/* Dot indicators for multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 items-center">
          {props.data.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex({ ...index, current: idx })}
              className={`w-2 h-2 rounded-full transition-all duration-300
                        ${
                          idx === index.current
                            ? "bg-white w-3 h-3 shadow-md"
                            : "bg-white/60"
                        }`}
              aria-label={`Go to image ${idx + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
});

PrimaryPhoto.displayName = "PrimaryPhoto"; // For better debugging in React DevTools
