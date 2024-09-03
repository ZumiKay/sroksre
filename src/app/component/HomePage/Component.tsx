"use client";
import { Button, Card, Skeleton } from "@nextui-org/react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import PrimaryButton from "../Button";
import { CSSProperties, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Orderpricetype } from "@/src/context/OrderContext";

export const BannerSkeleton = () => {
  return (
    <Card
      className="w-[350px] h-[270px] space-y-5 p-4"
      style={{ backgroundColor: "transparent" }}
      radius="lg"
    >
      <Skeleton className="rounded-lg">
        <div className="h-[200px] rounded-lg bg-default-300"></div>
      </Skeleton>
      <Skeleton className="w-3/5 rounded-lg">
        <div className="h-3 w-full rounded-lg bg-default-300"></div>
      </Skeleton>
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
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % props.data.length);
      }, 5000); // 5 seconds per slide
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, props.data.length]);

  const handleIndicatorClick = (index: number) => {
    setCurrentSlide(index);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, 5000);
  };

  const handleNavigate = (side: "next" | "prev") => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, 5000);

    if (side === "next") {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    } else {
      setCurrentSlide((prev) =>
        prev === 0 ? props.data.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="banner__container w-full h-fit relative overflow-x-hidden">
      <div className="w-full h-auto max-h-[95vh] min-h-[500px] relative overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {props.data.map(
            (data, idx) =>
              idx === currentSlide && (
                <div
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                  key={idx}
                  className="w-full h-auto relative"
                >
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    alt={data.name}
                    src={data.img}
                    className="w-full h-auto min-h-[500px] object-cover relative"
                    width={1000}
                    height={1000}
                    loading="lazy"
                  />
                  <motion.h3
                    initial={{ left: "10px" }}
                    animate={{ left: "5%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    onClick={() =>
                      data.link && (window.location.href = data.link)
                    }
                    className="title w-full h-[200px] max-small_phone:text-3xl cursor-pointer text-5xl text-white font-bold absolute top-[75%] left-5"
                  >
                    {data.name}
                  </motion.h3>
                </div>
              )
          )}
        </AnimatePresence>
      </div>

      <div className="control_item h-fit min-h-[50px] w-full flex flex-row justify-between items-center bg-[#495464] flex-wrap">
        <div className="indicator justify-end w-full flex flex-row gap-x-1 pr-2">
          {props.data.map((data, idx) => (
            <div
              key={idx}
              onClick={() => handleIndicatorClick(idx)}
              className="w-[50px] h-[50px] flex flex-col justify-center cursor-pointer"
            >
              <Image
                className={`object-cover w-[40px] h-[40px] rounded-sm ${
                  currentSlide === idx
                    ? "border-2 border-white ring-offset-1"
                    : ""
                }`}
                src={data.img}
                alt={data.name ?? `slide${idx}`}
                width={200}
                height={200}
              />
              {currentSlide === idx && (
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "40px" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-[5px] bg-white rounded-sm"
                ></motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        className="w-fit h-fit absolute top-[45%] cursor-pointer left-1 transition-all opacity-50 hover:scale-110 hover:opacity-100 active:scale-110"
        onClick={() => handleNavigate("prev")}
      >
        <div className="arrow text-[40px] grid place-content-center bg-black border border-white w-[50px] h-[50px] rounded-full text-white">
          {"<"}
        </div>
      </div>
      <div
        className="w-fit h-fit absolute top-[45%] cursor-pointer right-1 transition-all opacity-50 hover:scale-110 hover:opacity-100 active:scale-110"
        onClick={() => handleNavigate("next")}
      >
        <div className="arrow text-[40px] grid place-content-center bg-black border border-white w-[50px] h-[50px] rounded-full text-white">
          {">"}
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
    <div key={props.data.name} className="cate_card w-[500px] h-[700px]">
      <motion.img
        initial={{ left: "-20px" }}
        whileInView={{ left: 0 }}
        transition={{ duration: 1, ease: "easeIn" }}
        className="w-full h-[600px] object-cover relative transition-transform hover:scale-110"
        src={props.data.image.url}
        alt={props.data.image.name}
        width={"auto"}
        height={"auto"}
        loading="lazy"
        onClick={() => props.data.link && router.push(props.data.link)}
      />
      <div className="name text-[32px] grid place-content-center font-bold text-white w-full min-h-[50px] h-fit bg-[#495464] p-2 text-center">
        {props.data.name}
      </div>
    </div>
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
      <h3 className="title w-full h-fit text-3xl text-left text-black font-bold">
        {name}
      </h3>
      <div className="categories mt-5 w-full h-fit flex flex-row flex-wrap justify-center gap-20">
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
      className="w-full h-auto max-h-[90vh] flex flex-col overflow-hidden bg-white relative"
      ref={imgref}
    >
      <motion.img
        src={props.data.image.url}
        alt={props.data.image.name}
        style={{ translateY }}
        loading="lazy"
        className="object-cover w-full h-auto max-h-[90vh] min-h-[600px]"
      />
      <motion.h3
        initial={{ paddingLeft: "0px" }}
        whileInView={{ paddingLeft: "50px" }}
        transition={{
          duration: 2,
          ease: "linear",
        }}
        className="w-[85%] h-fit absolute bottom-20 text-white font-black text-5xl"
      >
        {props.data.name}
      </motion.h3>
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
    <div key={props.id} className="card w-[350px] h-fit flex flex-col">
      <div
        onClick={() => (window.location.href = `/product/detail/${props.id}`)}
      >
        <Image
          src={props.img.url}
          alt={props.img.name}
          width={"600"}
          height={"600"}
          loading="lazy"
          className="w-full h-[500px] object-contain cursor-pointer"
        />
      </div>

      <div className="detail w-full h-fit flex flex-col gap-y-5">
        <h3 className="text-lg font-bold w-full h-fit text-left">
          {props.name}
        </h3>
        {props.price.discount ? (
          <div className="w-full h-fit flex flex-row items-center gap-x-3">
            <h3 className="font-bold text-lg">
              {`$${props.price.discount.newprice?.toFixed(2)}`}
            </h3>
            <h3 className="font-light line-through text-lg">
              {`$${props.price.price.toFixed(2)}`}
            </h3>
            <h3 className="font-bold text-red-500 text-lg">{`${props.price.discount.percent}%`}</h3>
          </div>
        ) : (
          <h3 className="font-bold text-lg w-full h-fit">{`$${props.price.price.toFixed(
            2
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
      <div className="header w-full h-[60px] flex flex-row items-center justify-between bg-[#495464] p-2">
        <h3 className="text-2xl text-white font-bold w-full text-left">
          {props.title}
        </h3>
        <div className="w-[200px] flex flex-row items-center justify-end gap-x-3 select-none">
          <div
            onClick={() => handleScroll("left")}
            className="w-fit h-fit cursor-pointer left-1 transition-all hover:scale-110 active:scale-110"
          >
            <div className="arrow text-[40px] grid place-content-center bg-white text-black w-[40px] h-[40px] rounded-full">
              {"<"}
            </div>
          </div>
          <div
            onClick={() => handleScroll("right")}
            className="w-fit h-fit cursor-pointer right-1 transition-all hover:scale-110 active:scale-110"
          >
            <div className="arrow text-[40px] grid place-content-center bg-white text-black w-[40px] h-[40px] rounded-full">
              {">"}
            </div>
          </div>
        </div>
      </div>
      <div
        className="w-full overflow-x-auto scrollbar-hide overflow-y-hidden pb-20"
        ref={scrollref}
      >
        <div className="productlist w-fit h-fit flex flex-row items-center gap-x-5 mt-2">
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
