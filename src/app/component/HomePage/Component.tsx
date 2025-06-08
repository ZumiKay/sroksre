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
import PrimaryButton from "../Button";
import { ProductState } from "@/src/context/GlobalType.type";
import { ArrowLeftIcon, ArrowRightIcon } from "@mui/x-date-pickers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

export const BannerSkeleton = () => {
  return (
    <Card
      className="w-[350px] h-[270px] space-y-5 p-4 max-small_phone:w-[275px]"
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

export const SlideShow: React.FC<bannerprops> = (props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const SLIDE_DURATION = 10000; // 10 seconds per slide

  // Reset interval when slide changes
  const resetInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    }, SLIDE_DURATION);
  };

  // Initialize the interval
  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [props.data.length]);

  const handleIndicatorClick = (index: number) => {
    setCurrentSlide(index);
    resetInterval();
  };

  const handleNavigate = (side: "next" | "prev") => {
    resetInterval();

    if (side === "next") {
      setCurrentSlide((prev) => (prev + 1) % props.data.length);
    } else {
      setCurrentSlide((prev) =>
        prev === 0 ? props.data.length - 1 : prev - 1
      );
    }
  };

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
  };

  const titleVariants = {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-2xl bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Main slideshow container */}
      <div className="relative w-full h-auto max-h-[95vh] min-h-[500px] overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {props.data.map(
            (data, idx) =>
              idx === currentSlide && (
                <motion.div
                  key={idx}
                  className="relative w-full h-auto"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.8 }}
                >
                  {/* Image overlay gradient */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/70 pointer-events-none" />

                  <motion.img
                    alt={data.name}
                    src={data.img}
                    className="relative w-full h-auto min-h-[500px] object-cover"
                    width={1000}
                    height={1000}
                    loading="lazy"
                  />

                  <motion.div
                    className="absolute z-20 bottom-[15%] left-0 w-full px-6 md:px-10"
                    variants={titleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <h3
                      onClick={() => data.link && router.push(data.link)}
                      className={`
                        text-3xl sm:text-4xl md:text-5xl text-white font-bold 
                        leading-tight drop-shadow-lg max-w-2xl
                        ${
                          data.link
                            ? "cursor-pointer hover:underline decoration-2 underline-offset-4"
                            : ""
                        }
                      `}
                    >
                      {data.name}
                    </h3>

                    {data.link && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-6"
                      >
                        <Button
                          className="bg-white text-black hover:bg-gray-200 font-bold rounded-md px-8 py-3 transition-all duration-300 transform hover:scale-105"
                          size="lg"
                          onPress={() => router.push(data.link as string)}
                        >
                          Learn More
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all duration-300 hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        onClick={() => handleNavigate("prev")}
        aria-label="Previous slide"
        type="button"
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all duration-300 hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        onClick={() => handleNavigate("next")}
        aria-label="Next slide"
        type="button"
      >
        <ArrowRightIcon className="w-6 h-6" />
      </button>

      {/* Controls and indicators */}
      <div className="w-full bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-3">
          <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto py-2 gap-1">
            {props.data.map((data, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleIndicatorClick(idx)}
                className={`
                  relative group flex flex-col items-center p-1 rounded
                  ${currentSlide === idx ? "ring-2 ring-white/70" : ""}
                  focus:outline-none focus:ring-2 focus:ring-white/70
                `}
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div className="relative w-10 h-10 overflow-hidden rounded">
                  <Image
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    src={data.img}
                    alt={data.name ?? `slide${idx}`}
                    width={200}
                    height={200}
                  />
                </div>

                {currentSlide === idx && (
                  <div className="relative w-full h-1 mt-1 overflow-hidden bg-gray-700 rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: SLIDE_DURATION / 1000,
                        ease: "linear",
                      }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentSlide + 1} / {props.data.length}
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
    <div
      key={props.data.name}
      className="cate_card w-[500px] h-[700px]  max-smallest_tablet:w-full"
    >
      <motion.img
        initial={{ left: "-20px" }}
        whileInView={{ left: 0 }}
        transition={{ duration: 1, ease: "easeIn" }}
        className="w-full h-[600px] object-cover 
        relative transition-transform hover:scale-110
       
        "
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
  const router = useRouter();

  return (
    <div key={name} className="w-full h-fit">
      <h3 className="title w-full h-fit text-3xl text-left text-black font-bold">
        {name}
      </h3>

      <div className="categories mt-5 w-full h-fit flex flex-row flex-wrap justify-center gap-20">
        {data.map((cate, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (cate.link) {
                router.push(cate.link);
              }
            }}
            className="w-fit h-fit"
          >
            <CategoryCard
              key={idx}
              data={{
                image: cate.image,
                name: cate.name,
              }}
            />
          </div>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], ["10%", "-5%"]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.8, 1],
    [0.6, 1, 1, 0.8]
  );

  // Animation variants for consistent animations
  const textAnimation = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const buttonAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, delay: 0.3, ease: "easeOut" },
    },
  };

  return (
    <div
      key={props.data.name}
      style={{
        ...props.style,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
      className="w-full h-auto max-h-[90vh] flex flex-col overflow-hidden bg-white relative rounded-xl"
      ref={containerRef}
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10 pointer-events-none" />

      <motion.div
        className="w-full h-full overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4 }}
      >
        <motion.img
          src={props.data.image.url}
          alt={props.data.image.name}
          style={{ translateY, opacity }}
          loading="lazy"
          width={600}
          height={600}
          className="object-cover w-full h-auto max-h-[90vh] min-h-[600px]"
        />
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-20 flex flex-col gap-4 md:gap-6">
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={textAnimation}
          className="w-[90%] md:w-[85%] text-white font-black text-4xl sm:text-5xl md:text-6xl leading-tight drop-shadow-xl"
        >
          {props.data.name}
        </motion.h3>

        {props.data.link && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={buttonAnimation}
          >
            <PrimaryButton
              text="Learn More"
              width="fit-content"
              height="50px"
              type="button"
              onClick={() => window.open(props.data.link, "_blank")}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const ProductCard = (props: ProductState) => {
  return (
    <div key={props.id} className="card w-[350px] h-fit flex flex-col">
      <div
        onClick={() => (window.location.href = `/product/detail/${props.id}`)}
      >
        {props.covers ? (
          <Image
            src={props.covers[0].url}
            alt={props.covers[0].name}
            width={"600"}
            height={"600"}
            loading="lazy"
            className="w-full h-[500px] object-contain cursor-pointer"
          />
        ) : (
          <p className="w-full h-full text-black font-bold text-center">
            Cover
          </p>
        )}
      </div>

      <div className="detail w-full h-fit flex flex-col gap-y-5">
        <h3 className="text-lg font-bold w-full h-fit text-left">
          {props.name}
        </h3>
        {props.discount ? (
          <div className="w-full h-fit flex flex-row items-center gap-x-3">
            <h3 className="font-bold text-lg">
              {`$${props.discount.newprice}`}
            </h3>
            <h3 className="font-light line-through text-lg">
              {`$${props.price.toFixed(2)}`}
            </h3>
            <h3 className="font-bold text-red-500 text-lg">{`${props.discount.percent}%`}</h3>
          </div>
        ) : (
          <h3 className="font-bold text-lg w-full h-fit">{`$${props?.price?.toFixed(
            2
          )}`}</h3>
        )}
      </div>
    </div>
  );
};

interface ScrollableContainerProps {
  title: string;
  items: ProductState[];
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
            <div className="arrow text-[20px] flex items-center justify-center bg-white text-black w-[40px] h-[40px] rounded-full">
              <FontAwesomeIcon icon={faArrowLeft} />
            </div>
          </div>
          <div
            onClick={() => handleScroll("right")}
            className="w-fit h-fit cursor-pointer right-1 transition-all hover:scale-110 active:scale-110"
          >
            <div className="arrow text-[20px] flex items-center justify-center bg-white text-black w-[40px] h-[40px] rounded-full">
              <FontAwesomeIcon icon={faArrowRight} />
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
            <ProductCard key={idx} {...data} />
          ))}
        </div>
      </div>
    </div>
  );
};
