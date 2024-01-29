"use client";

import Image from "next/image";
import ErrorIcon from "./Asset/Image/error_icon.png";
import Link from "next/link";
import PrimaryButton from "./component/Button";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="error_container w-screen h-screen flex flex-col gap-y-5 justify-center items-center">
          <Image
            src={ErrorIcon}
            alt="by Freepik"
            className="w-[200px] h-[200px] object-contain"
          />
          <h3 className="text-sm font-light">
            Desgined by{" "}
            <Link
              className="text-blue-500 underline"
              href={"https://freepik.com"}
            >
              Freepik
            </Link>
          </h3>
          <h1 className="error_title font-bold text-3xl">Error Occured </h1>
          <h3 className="error_message font-normal text-xl">
            <strong>500 - </strong> {error.message}
          </h3>
          <h3 className="error_message font-normal text-xl">
            Please contact us for assistance if needed by this
            <Link
              className="font-blue-700 hover:text-white active:text-white"
              href={"mailto:ssecomerce@gmail.com"}
            >
              {" "}
              ssecomerce@gmail.com{" "}
            </Link>
          </h3>

          <PrimaryButton
            text={"Reload"}
            type="button"
            width="50%"
            onClick={() => reset()}
          />
        </div>
      </body>
    </html>
  );
}
