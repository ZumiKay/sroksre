import { AnimationControls, motion } from "framer-motion";

export const LineSvg = ({ control }: { control: AnimationControls }) => {
  return (
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
        stroke={"lightgray"}
        strokeWidth={"10px"}
      />
    </svg>
  );
};

const LinearGradient = (color: string, control?: AnimationControls) => {
  return (
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
};

const CircleSvg = ({
  step,
  control,
  active,
  handleClick,
}: {
  step?: number;
  control?: AnimationControls;
  handleClick?: () => void;
  active: boolean;
}) => {
  return (
    <div
      onClick={() => {
        if (handleClick) handleClick();
      }}
      className="w-[70px] h-[70px] 
     
       relative grid place-items-center"
    >
      <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
        {active && LinearGradient("#495464", control)}
        <motion.circle
          animate={control}
          r="25"
          cx="35"
          cy="35"
          fill={active ? `url(#grad5)` : "white"}
          stroke={"#495464"}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      {step === 4 ? (
        <div className="w-fit h-fit absolute">
          {" "}
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
};

export default CircleSvg;

export const Checkmarksvg = () => {
  return (
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
};
