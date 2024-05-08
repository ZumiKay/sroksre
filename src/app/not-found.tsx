import Link from "next/link";
import { headers } from "next/headers";
import Errorwheel from "../../public/Image/errorwheel.png";
import Image from "next/image";

export default async function NotFound() {
  return (
    <div>
      <div className="notfound_container w-full h-[75vh] flex flex-col items-center justify-center text-center gap-y-5">
        <Image
          alt="Image By Freepik"
          src={Errorwheel}
          className="w-[200px] h-[200px] object-contain"
        />
        <h5 className="text-[10px] font-light">
          {" "}
          Designed By{" "}
          <Link
            href={"https://freepik.com"}
            className="text-blue-500 underline"
          >
            {" "}
            Freepik{" "}
          </Link>
        </h5>
        <h1 className="error_mess text-4xl font-bold w-full h-[50px]">
          Page Not Found
        </h1>
        <h3 className="text-xl font-light w-full h-fit">
          <strong className="font-semibold">404 Error</strong> - There is no
          such page. If this is a mistakes please contact us
        </h3>
      </div>
    </div>
  );
}
