"use client";

import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import { AnimationControls, motion, useAnimation } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// Internal SVG primitives
// -----------------------------------------------------------------------------

const LineSvg = ({
  control,
  active,
}: {
  control: AnimationControls;
  active: boolean;
}) => (
  <svg
    viewBox="0 0 100 20"
    preserveAspectRatio="none"
    className="w-full h-4"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.line
      initial={{ pathLength: 0 }}
      animate={control}
      x1="0"
      y1="10"
      x2="100"
      y2="10"
      stroke="lightgray"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

const LinearGradient = (color: string, control?: AnimationControls) => (
  <defs>
    <motion.linearGradient
      initial={{ x2: 0 }}
      animate={control}
      id="grad5"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >
      <stop offset="100%" stopColor={color} />
      <stop offset="0%" stopColor="white" />
    </motion.linearGradient>
  </defs>
);

export const Checkmarksvg = () => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="white"
  >
    <motion.path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
  </motion.svg>
);

// -----------------------------------------------------------------------------
// CircleSvg – default export kept for any direct consumers
// -----------------------------------------------------------------------------

const CircleSvg = ({
  step,
  children,
  control,
  active,
  handleClick,
}: {
  step?: number;
  children?: ReactNode;
  control?: AnimationControls;
  handleClick?: () => void;
  active: boolean;
}) => (
  <div
    onClick={() => handleClick?.()}
    className="w-11 h-11 sm:w-14 sm:h-14 relative grid place-items-center"
  >
    <svg viewBox="0 0 70 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {active && LinearGradient("#495464", control)}
      <motion.circle
        animate={control}
        r="25"
        cx="35"
        cy="35"
        fill={active ? "url(#grad5)" : "white"}
        stroke="#495464"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
    {step === 4 ? (
      <div className="w-fit h-fit absolute scale-75 sm:scale-100">
        <Checkmarksvg />
      </div>
    ) : (
      <h3
        style={!active ? { color: "black" } : { color: "white" }}
        className="text-xs sm:text-base w-fit h-fit absolute font-bold"
      >
        {step}
      </h3>
    )}
  </div>
);


// -----------------------------------------------------------------------------
// StepComponent
// -----------------------------------------------------------------------------

export const StepComponent = ({
  data,
  isActive,
}: {
  data: Stepindicatortype;
  isActive: boolean;
}) => {
  const sequence = useAnimation();
  const linesequence = useAnimation();

  const animate = async () => {
    await linesequence.start(
      data.active
        ? { pathLength: 0, transition: { duration: 0 } }
        : { pathLength: 1 },
    );
    await sequence.start({
      pathLength: 1,
      transition: { duration: 0.5, ease: "easeInOut" },
    });
    await sequence.start({
      x2: "100%",
      transition: { duration: 0.5, ease: "easeInOut" },
    });
    await linesequence.start({
      pathLength: 1,
      stroke: data.active ? "#495464" : "#d2d2d2",
    });
  };

  useEffect(() => {
    animate();
  }, [isActive]);

  return (
    <div
      key={data.idx}
      className="step_container flex-1 flex flex-row items-center justify-center min-w-0"
    >
      <div className="indicator flex flex-col items-center justify-center shrink-0">
        <CircleSvg control={sequence} step={data.step} active={isActive} />
        <h3 className="title text-[11px] sm:text-xs md:text-sm font-medium text-center mt-1 px-0.5 whitespace-nowrap">
          {data.title}
        </h3>
      </div>
      <div
        hidden={data.noline}
        className="flex-1 hidden sm:block h-fit -mt-4 px-1"
      >
        <LineSvg control={linesequence} active={isActive} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// StepIndicator
// -----------------------------------------------------------------------------

const STEPS_INITIAL: Stepindicatortype[] = [
  { step: 1, title: "Summary", active: false },
  { step: 2, title: "Fill in info", active: false },
  { step: 3, title: "Payment", active: false },
  { step: 4, title: "Complete", noline: true, active: false },
];

export const StepIndicator = ({ step }: { step: number }) => {
  const [stepdata, setStepdata] = useState<Stepindicatortype[]>(STEPS_INITIAL);

  useEffect(() => {
    setStepdata(STEPS_INITIAL.map((s) => ({ ...s, active: s.step === step })));
  }, [step]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-row justify-between items-center gap-1 sm:gap-2 px-1 sm:px-4">
      {stepdata.map((s, idx) => (
        <StepComponent
          key={idx}
          data={s}
          isActive={stepdata[idx].active ?? false}
        />
      ))}
    </div>
  );
};
