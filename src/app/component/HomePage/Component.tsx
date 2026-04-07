"use client";
import { Button, Card, Skeleton } from "@heroui/react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

import { CSSProperties, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Orderpricetype } from "@/src/types/order.type";
import PrimaryButton from "../Button";

export const BannerSkeleton = () => {
  return (
    <Card
      className="w-87.5 h-67.5 space-y-5 p-4 max-small_phone:w-68.75 bg-linear-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-lg"
      style={{ backgroundColor: "transparent" }}
      radius="lg"
    >
      <Skeleton className="rounded-xl">
        <div className="h-50 rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
      </Skeleton>
      <div className="space-y-3">
        <Skeleton className="w-4/5 rounded-lg">
          <div className="h-4 w-full rounded-lg bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
        </Skeleton>
        <Skeleton className="w-3/5 rounded-lg">
          <div className="h-3 w-full rounded-lg bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
        </Skeleton>
      </div>
    </Card>
  );
};

interface bannerprops {
  type?: "slide" | "banner";
  data: {
    img: string;
    name?: string;
    link?: string;
  }[];
}

export const SlideShow = (props: bannerprops) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, 10000); // 5 seconds per slide

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [props.data.length]);

  const handleIndicatorClick = (index: number) => {
    setCurrentSlide(index);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, 10000);
  };

  const handleNavigate = (side: "next" | "prev") => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, 10000);

    if (side === "next") {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    } else {
      setCurrentSlide((prev) =>
        prev === 0 ? props.data.length - 1 : prev - 1,
      );
    }
  };

  return (
    <div className="banner__container w-full h-fit relative overflow-x-hidden shadow-2xl">
      <div className="w-full h-auto max-h-[95vh] min-h-125 relative overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {props.data.map(
            (data, idx) =>
              idx === currentSlide && (
                <div key={idx} className="w-full h-auto relative">
                  <motion.img
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    alt={data.name}
                    src={data.img}
                    className="w-full h-auto min-h-125 object-cover relative"
                    width={1000}
                    height={1000}
                    loading="lazy"
                  />
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                  <motion.h3
                    initial={{ left: "10px", opacity: 0 }}
                    animate={{ left: "5%", opacity: 1 }}
                    transition={{
                      duration: 1.5,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                    onClick={() =>
                      data.link && (window.location.href = data.link)
                    }
                    className="title w-full h-50 max-small_phone:text-3xl cursor-pointer text-5xl text-white font-bold absolute top-[70%] left-5 drop-shadow-2xl hover:text-blue-300 transition-colors duration-300"
                  >
                    {data.name}
                  </motion.h3>
                </div>
              ),
          )}
        </AnimatePresence>
      </div>

      <div className="control_item h-fit min-h-15 w-full flex flex-row justify-between items-center bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 flex-wrap px-4 py-2 shadow-lg">
        {props.data[currentSlide].link && (
          <Button
            className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold max-w-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            size="lg"
            onPress={() =>
              router.replace(props.data[currentSlide].link as string)
            }
          >
            <span className="flex items-center gap-2">
              Learn More
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Button>
        )}
        <div className="indicator justify-end w-full flex flex-row gap-x-2 pr-2">
          {props.data.map((data, idx) => (
            <div
              key={idx}
              onClick={() => handleIndicatorClick(idx)}
              className="w-12.5 h-12.5 flex flex-col justify-center cursor-pointer group"
            >
              <Image
                className={`object-cover w-11 h-11 rounded-lg transition-all duration-300 ${
                  currentSlide === idx
                    ? "border-3 border-blue-400 ring-2 ring-blue-300 ring-offset-2 ring-offset-gray-800 shadow-lg scale-110"
                    : "border-2 border-gray-600 opacity-60 hover:opacity-100 hover:border-gray-400 hover:scale-105"
                }`}
                src={data.img}
                alt={data.name ?? `slide${idx}`}
                width={200}
                height={200}
              />
              {currentSlide === idx && (
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "44px" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-0.75 bg-linear-to-r from-blue-400 via-blue-500 to-blue-400 rounded-full shadow-lg mt-1"
                ></motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        className="w-fit h-fit absolute top-[45%] cursor-pointer left-4 transition-all opacity-70 hover:scale-110 hover:opacity-100 active:scale-95 z-10"
        onClick={() => handleNavigate("prev")}
      >
        <div className="arrow text-[28px] grid place-content-center bg-linear-to-br from-gray-900 to-black backdrop-blur-xs border-2 border-white/30 w-15 h-15 rounded-full text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:border-blue-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>
      </div>
      <div
        className="w-fit h-fit absolute top-[45%] cursor-pointer right-4 transition-all opacity-70 hover:scale-110 hover:opacity-100 active:scale-95 z-10"
        onClick={() => handleNavigate("next")}
      >
        <div className="arrow text-[28px] grid place-content-center bg-linear-to-br from-gray-900 to-black backdrop-blur-xs border-2 border-white/30 w-15 h-15 rounded-full text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:border-blue-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface Categorycardprops {
  data: {
    image: {
      url: string;
      name: string;
    };
    name: string;
    link?: string;
  };
}
const CategoryCard = (props: Categorycardprops) => {
  const router = useRouter();
  return (
    <motion.div
      key={props.data.name}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="cate_card relative w-85 max-smallest_tablet:w-full rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 group cursor-pointer select-none"
      onClick={() => props.data.link && router.push(props.data.link)}
    >
      {/* Image */}
      <div className="relative h-115 overflow-hidden">
        <motion.img
          initial={{ scale: 1.08, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          src={props.data.image.url}
          alt={props.data.image.name}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end justify-between gap-3">
          <h3 className="text-2xl font-extrabold text-white leading-tight drop-shadow-md translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
            {props.data.name}
          </h3>
          <span className="shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute -inset-full top-0 h-full w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[350%] transition-transform duration-700 ease-in-out" />
      </div>
    </motion.div>
  );
};

interface CategoryContainerProps {
  name?: string;
  data: {
    image: {
      url: string;
      name: string;
    };
    name: string;
    link?: string;
  }[];
}

export const CategoryContainer = ({ name, data }: CategoryContainerProps) => {
  return (
    <div key={name} className="w-full h-fit">
      <h3 className="title w-full h-fit text-4xl text-left bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent font-black mb-8 flex items-center gap-3">
        <div className="w-2 h-10 bg-linear-to-b from-blue-500 to-purple-600 rounded-full"></div>
        {name}
      </h3>

      <div className="categories mt-8 w-full h-fit flex flex-row flex-wrap justify-center gap-8">
        {data.map((cate, idx) => (
          <CategoryCard
            key={idx}
            data={{
              image: cate.image,
              name: cate.name,
              link: cate.link,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface BannerProps {
  data: {
    image: {
      url: string;
      name: string;
    };
    name: string;
    link?: string;
  };
  style?: CSSProperties;
}

export const Banner: React.FC<BannerProps> = (props) => {
  const imgref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: imgref,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], ["10%", "-2%"]);
  return (
    <div
      key={props.data.name}
      style={props.style}
      className="w-full h-auto max-h-[90vh] flex flex-col overflow-hidden bg-white relative rounded-2xl shadow-2xl"
      ref={imgref}
    >
      <motion.img
        src={props.data.image.url}
        alt={props.data.image.name}
        style={{ translateY }}
        loading="lazy"
        width={600}
        height={600}
        className="object-cover w-full h-auto max-h-[90vh] min-h-150"
      />
      {/* Gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      <motion.h3
        initial={{ paddingLeft: "0px", opacity: 0 }}
        whileInView={{ paddingLeft: "50px", opacity: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
        }}
        className="w-[85%] h-fit absolute bottom-32 text-white font-black text-5xl drop-shadow-2xl"
      >
        {props.data.name}
      </motion.h3>
      {props.data.link && (
        <div className="absolute bottom-10 left-12.5">
          <PrimaryButton
            text="Learn More"
            width="270px"
            height="55px"
            type="button"
            radius="12px"
            color="#3B82F6"
            hoverColor="#2563EB"
            onClick={() => (window.location.href = props.data.link as string)}
          />
        </div>
      )}
    </div>
  );
};

interface ProductCardProps {
  id: number;
  img: {
    name: string;
    url: string;
  };
  name: string;
  price: Orderpricetype;
}
export const ProductCard = (props: ProductCardProps) => {
  return (
    <div
      key={props.id}
      className="card w-87.5 h-fit flex flex-col bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer border border-gray-100"
      onClick={() => (window.location.href = `/product/detail/${props.id}`)}
    >
      <div className="relative overflow-hidden bg-gray-50">
        <Image
          src={props.img.url}
          alt={props.img.name}
          width={"600"}
          height={"600"}
          loading="lazy"
          className="w-full h-125 object-contain transition-transform duration-700 group-hover:scale-110"
        />
        {props.price.discount && (
          <div className="absolute top-4 right-4 bg-linear-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            -{props.price.discount.percent}%
          </div>
        )}
      </div>

      <div className="detail w-full h-fit flex flex-col gap-y-4 p-6">
        <h3 className="text-lg font-bold w-full h-fit text-left text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          {props.name}
        </h3>
        {props.price.discount ? (
          <div className="w-full h-fit flex flex-row items-center gap-x-3 flex-wrap">
            <h3 className="font-bold text-2xl text-blue-600">
              {`$${props.price.discount.newprice?.toFixed(2)}`}
            </h3>
            <h3 className="font-normal line-through text-base text-gray-400">
              {`$${props.price.price.toFixed(2)}`}
            </h3>
            <div className="ml-auto bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
              Save $
              {(
                props.price.price - (props.price.discount.newprice || 0)
              ).toFixed(2)}
            </div>
          </div>
        ) : (
          <h3 className="font-bold text-2xl w-full h-fit text-blue-600">{`$${props.price.price.toFixed(
            2,
          )}`}</h3>
        )}
      </div>
    </div>
  );
};

interface ScrollableContainerProps {
  title: string;
  items: {
    id: number;
    img: {
      url: string;
      name: string;
    };
    name: string;
    price: Orderpricetype;
  }[];
}
export const ScrollableContainer = (props: ScrollableContainerProps) => {
  const scrollref = useRef<HTMLDivElement>(null);

  const handleScroll = (pos: "left" | "right") => {
    if (scrollref.current) {
      if (pos === "left") {
        scrollref.current.scrollBy({ left: -300, behavior: "smooth" });
      } else {
        scrollref.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }
  };
  return (
    <div key={props.title} className="w-full h-fit">
      <div className="header w-full h-17.5 flex flex-row items-center justify-between bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 px-6 py-3 rounded-t-2xl shadow-lg">
        <h3 className="text-3xl text-white font-bold w-full text-left flex items-center gap-3">
          <div className="w-1.5 h-8 bg-linear-to-b from-blue-400 to-purple-600 rounded-full"></div>
          {props.title}
        </h3>
        <div className="w-50 flex flex-row items-center justify-end gap-x-3 select-none">
          <div
            onClick={() => handleScroll("left")}
            className="w-fit h-fit cursor-pointer transition-all hover:scale-110 active:scale-95 group"
          >
            <div className="arrow text-[20px] flex items-center justify-center bg-linear-to-br from-white to-gray-100 hover:from-blue-500 hover:to-blue-600 text-gray-800 hover:text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
          </div>
          <div
            onClick={() => handleScroll("right")}
            className="w-fit h-fit cursor-pointer transition-all hover:scale-110 active:scale-95 group"
          >
            <div className="arrow text-[20px] flex items-center justify-center bg-linear-to-br from-white to-gray-100 hover:from-blue-500 hover:to-blue-600 text-gray-800 hover:text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        className="w-full overflow-x-auto scrollbar-hide overflow-y-hidden pb-20 bg-linear-to-b from-gray-50 to-white rounded-b-2xl"
        ref={scrollref}
      >
        <div className="productlist w-fit h-fit flex flex-row items-center gap-x-6 mt-8 px-6 pb-6">
          {props.items.map((data, idx) => (
            <ProductCard
              key={idx}
              id={data.id}
              img={data.img}
              name={data.name}
              price={data.price}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
