"use client";
import Image from "next/image";
import Logo from "../../../public/Image/Logo.svg";
import PrimaryButton from "./Button";
import { TextField } from "@mui/material";
import Link from "next/link";
export default function Footer() {
  return (
    <footer className="footer__container mt-20 h-full w-full bg-[#F4F4F2]">
      <section className="footer__header flex flex-row items-center w-full h-fit">
        <Image
          className="logo pl-2 w-[130px] h-[130px] object-fill"
          alt="logo"
          src={Logo}
        />
        <hr className="h-line w-[90vw] h-[10px] bg-[#495464]" />
      </section>
      <section className="pl-2 footer__body w-full flex flex-row items-center justify-between max-small_tablet:flex-col max-small_tablet:justify-start max-small_tablet:items-start gap-y-10 pb-10">
        <form className="footer__subscibe w-1/3 max-small_tablet:w-full h-fit flex flex-col gap-y-5">
          <TextField
            type="email"
            id="standard-basic"
            label="Email Address"
            variant="standard"
            fullWidth
            required
          />
          <p className="subcribe__des underline text-md font-light break-words w-[80%]">
            Your personal data will be used for the the sharing promotion or
            others related event. For any further information, please read the
            Privacy Policy.
          </p>
          <PrimaryButton text="Subscribe" type="submit" radius="10px" />
        </form>
        <ul className="help__container list-none h-fit flex flex-col gap-y-5 max-small_tablet:w-[90%]">
          <li className="header font-bold text-xl">About Us</li>
          <li>
            <Link href={"/account"}>Login/SignUp</Link>{" "}
          </li>
          <li>
            <Link href={"/privacyandpolicy"}>Privacy and Policies</Link>
          </li>
          <li>
            <Link href={"/contact"}>Contact us</Link>
          </li>
        </ul>
        <ul className="social__container list-none h-fit flex flex-col gap-y-5">
          <li className="header font-bold text-xl">Follow Us</li>
          <li>Facebook</li>
          <li>Instagram</li>
          <li>Telegram</li>
          <li>+85523880880</li>
        </ul>
      </section>
    </footer>
  );
}
