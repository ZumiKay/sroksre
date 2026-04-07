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
    style={{ position: "relative", top: "-15px" }}
    height="50"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.line
      initial={{ pathLength: 0 }}
      animate={control}
      x1="0"
      y1="50"
      x2="250"
      y2="50"
      stroke="lightgray"
      strokeWidth="10px"
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
    className="w-17 h-17.5 relative grid place-items-center"
  >
    <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
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
      <div className="w-fit h-fit absolute">
        <Checkmarksvg />
      </div>
    ) : (
      <h3
        style={!active ? { color: "black" } : { color: "white" }}
        className="text-lg w-fit h-fit absolute text-white font-bold"
      >
        {step}
      </h3>
    )}
  </div>
);

export default CircleSvg;

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
      className={`step_container w-45 max-h-75 h-fit flex flex-row justify-center
        max-small_phone:w-37.5 max-smallest_phone:w-30
        ${data.step === 2 ? "max-large_phone:grid max-large_phone:place-content-start" : ""}
        max-smallest_phone:grid max-smallest_phone:place-content-start`}
      style={data.noline ? { display: "grid", placeContent: "start" } : {}}
    >
      <div className="indicator h-37.5 w-full max-small_phone:h-25 flex flex-col items-center">
        <CircleSvg control={sequence} step={data.step} active={isActive} />
        <h3 className="title text-lg font-medium w-full h-fit text-center">
          {data.title}
        </h3>
      </div>
      <div
        hidden={data.noline}
        className={`w-full h-fit
          ${data.step === 2 ? "max-large_phone:hidden" : ""}
          ${data.step === 1 ? "max-smallest_phone:hidden" : ""}
          ${data.step === 3 ? "max-smallest_phone:hidden" : ""}`}
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
    <div className="w-full flex flex-row justify-center items-center gap-0 max-small_phone:grid max-small_phone:grid-cols-2 max-small_phone:gap-y-4 max-small_phone:px-4">
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
