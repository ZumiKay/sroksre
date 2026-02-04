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

  // Track loading state for images
  const [isImageLoading, setIsImageLoading] =
    useState<Record<string, boolean>>();

  // Zoom modal state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string>("");
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const imgState: Record<string, boolean> = {};

    props.data.forEach((data) => {
      imgState[data.url] = true;
    });

    setIsImageLoading(imgState);
  }, []);

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

  const handleImageClick = (url: string) => {
    setZoomedImageUrl(url);
    setIsZoomed(true);
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleZoomClose = () => {
    setIsZoomed(false);
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.5, 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale > 1) {
      const { left, top, width, height } =
        e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setZoomPosition({ x, y });
    }
  };

  return (
    <div
      style={props.style}
      className="primaryphoto__container relative flex flex-col gap-y-0 w-full
      max-smaller_screen:w-[400px] 
      max-large_tablet:w-[280px] 
      h-full 
      overflow-hidden
      rounded-lg shadow-lg bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image Container */}
      <div
        style={{ transform: `translateX(-${index.current * 100}%)` }}
        className="imagecontainer flex w-full h-full transition-transform duration-500 ease-in-out"
      >
        {props.data?.map((obj, idx) => {
          return (
            <div
              key={idx}
              className="flex-shrink-0 h-full w-full flex items-center justify-center relative bg-white"
            >
              {/* Loading Skeleton */}
              {isImageLoading?.[obj.url] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20 animate-pulse"></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium animate-pulse">
                      Loading image...
                    </span>
                  </div>
                </div>
              )}

              {/* Image with fade-in animation */}
              <div
                className="cursor-zoom-in relative group"
                onClick={() => handleImageClick(obj.url)}
              >
                <Image
                  src={obj.url}
                  alt={`${obj.name}`}
                  className={`w-[280px] h-[350px] object-contain transition-all duration-300 ${
                    isImageLoading?.[obj.url] ? "opacity-0" : "opacity-100"
                  } group-hover:scale-105`}
                  width={400}
                  height={550}
                  quality={80}
                  priority={idx === 0}
                  onLoad={() => {
                    setIsImageLoading((prev) => ({
                      ...prev,
                      [obj.url]: false,
                    }));
                  }}
                />
                {/* Zoom indicator on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <i className="fa-solid fa-magnifying-glass-plus text-gray-700 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows - Desktop */}
      {!props.isMobile &&
        !props.isTablet &&
        props.hover &&
        props.data &&
        props.data.length > 1 && (
          <>
            <button
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              onClick={() => handleClick("left")}
              className="absolute top-1/2 -translate-y-1/2 left-2 z-10
                w-10 h-10 flex items-center justify-center
                bg-white/90 hover:bg-white
                backdrop-blur-sm
                rounded-full shadow-lg
                transition-all duration-200
                hover:scale-110 hover:shadow-xl
                active:scale-95
                group"
              aria-label="Previous image"
            >
              <i className="fa-solid fa-chevron-left text-lg text-gray-700 group-hover:text-gray-900 transition-colors"></i>
            </button>

            <button
              onMouseEnter={() => props.setclick && props.setclick(true)}
              onMouseLeave={() => props.setclick && props.setclick(false)}
              onClick={() => handleClick("right")}
              className="absolute top-1/2 -translate-y-1/2 right-2 z-10
                w-10 h-10 flex items-center justify-center
                bg-white/90 hover:bg-white
                backdrop-blur-sm
                rounded-full shadow-lg
                transition-all duration-200
                hover:scale-110 hover:shadow-xl
                active:scale-95
                group"
              aria-label="Next image"
            >
              <i className="fa-solid fa-chevron-right text-lg text-gray-700 group-hover:text-gray-900 transition-colors"></i>
            </button>
          </>
        )}

      {/* Dot Indicators */}
      {props.data && props.data.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {props.data.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setindex({ ...index, current: idx })}
              className={`transition-all duration-300 rounded-full ${
                idx === index.current
                  ? "w-6 h-2 bg-blue-500"
                  : "w-2 h-2 bg-gray-400 hover:bg-gray-500"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {props.showcount && (
        <div className="w-full text-center text-white bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 py-2 px-4 text-sm font-semibold shadow-md">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-images text-xs opacity-75"></i>
            <span>
              {props.data?.length > 0 ? index.current + 1 : index.current} /{" "}
              {props.data?.length}
            </span>
          </span>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={handleZoomClose}
        >
          {/* Close button */}
          <button
            onClick={handleZoomClose}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center
              bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full
              transition-all duration-200 hover:scale-110 group z-10"
            aria-label="Close zoom view"
          >
            <i className="fa-solid fa-xmark text-white text-2xl group-hover:rotate-90 transition-transform duration-200"></i>
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoomScale <= 1}
              className="w-12 h-12 flex items-center justify-center
                bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full
                transition-all duration-200 hover:scale-110
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Zoom out"
            >
              <i className="fa-solid fa-magnifying-glass-minus text-white text-lg"></i>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoomScale >= 3}
              className="w-12 h-12 flex items-center justify-center
                bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full
                transition-all duration-200 hover:scale-110
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Zoom in"
            >
              <i className="fa-solid fa-magnifying-glass-plus text-white text-lg"></i>
            </button>
            <div
              className="w-12 h-12 flex items-center justify-center
              bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-semibold"
            >
              {zoomScale}x
            </div>
          </div>

          {/* Zoomed image container */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
          >
            <div
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomScale}) translate(${
                  zoomScale > 1 ? (50 - zoomPosition.x) * 0.5 : 0
                }%, ${zoomScale > 1 ? (50 - zoomPosition.y) * 0.5 : 0}%)`,
              }}
            >
              <Image
                src={zoomedImageUrl}
                alt="Zoomed view"
                width={1200}
                height={1200}
                quality={100}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                priority
              />
            </div>
          </div>

          {/* Instructions */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 
            bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm"
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-mouse-pointer text-xs"></i>
              <span className="cursor-pointer">Move mouse to pan • Close</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
