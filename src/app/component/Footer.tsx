import Image from "next/image";
import Logo from "../../../public/Image/Logo.svg";
import Link from "next/link";
import { getPolicesByPage } from "../api/policy/route";

export default async function Footer() {
  const policies = await getPolicesByPage("footer");
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
      <section className="footer__body w-[90%] flex flex-row items-start justify-end gap-52 max-small_tablet:flex-col max-small_tablet:justify-start max-small_tablet:items-start gap-y-10 pb-10">
        <ul className="help__container list-none h-fit flex flex-col gap-y-5 max-small_tablet:w-[90%]">
          <li className="header font-bold text-xl">About Us</li>
          <li className="text-[15px] font-normal transition-colors hover:text-gray-300 active:text-gray-300">
            <Link href={"/account"}>Login/SignUp</Link>{" "}
          </li>
          <li className="text-[15px] font-normal transition-colors hover:text-gray-300 active:text-gray-300">
            <Link href={"/privacyandpolicy"}>Privacy and Policies</Link>
          </li>
          <li className="text-[15px] font-normal transition-colors hover:text-gray-300 active:text-gray-300">
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
        <ul className="social__container list-none h-fit flex flex-col gap-y-5">
          <li className="header font-bold text-xl">Support</li>
          {policies.map((policy) => (
            <li
              key={policy.id}
              className="text-[15px] font-normal transition-colors hover:text-gray-300 active:text-gray-300"
            >
              <Link href={`/privacyandpolicy?p=${policy.id}`}>
                {policy.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </footer>
  );
}
