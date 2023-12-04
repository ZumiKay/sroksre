import Image from "next/image";
import Default from "../Asset/Image/default.png";
interface bannerprops {
  title?: string;
  img?: string;
  width?: string;
  height?: string;
}

export default function Banner(props: bannerprops) {
  return (
    <div className="banner__container w-fit">
      <Image
        className={`banner object-cover`}
        src={props.img ?? Default}
        alt="banner"
        style={{ width: props.width ?? "95vw", height: props.height ?? "80vh" }}
      />
      {props.title && (
        <h3
          className={`banner_title bg-[#495464] h-[45px] font-bold text-white flex items-center  pl-2 `}
          style={{ width: props.width ?? "95vw" }}
        >
          {" "}
          {props.title ?? "No Title"}{" "}
        </h3>
      )}
    </div>
  );
}
