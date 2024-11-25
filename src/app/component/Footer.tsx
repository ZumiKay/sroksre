import Image from "next/image";
import Logo from "../../../public/Image/Logo.svg";
import Link from "next/link";
import { getPolicesByPage } from "../api/policy/route";

export default async function Footer() {
  const policies = await getPolicesByPage("footer");
  return (
    <footer className="footer__container mt-20 h-full w-full bg-[#F4F4F2] flex flex-col items-center pb-32">
      <section className="footer__header flex flex-row items-center w-full h-fit">
        <Image
          className="logo pl-2 w-[130px] h-[130px] object-fill"
          alt="logo"
          src={Logo}
        />
        <hr className="h-line w-[90vw] h-[10px] bg-[#495464]" />
      </section>
      <section className="footer__body w-[95vw] flex flex-row justify-start flex-wrap gap-x-56 gap-y-10">
        <ul className="help__container list-none h-fit flex flex-col gap-y-5 w-fit">
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

        <ul className="social__container list-none h-fit flex flex-col gap-y-5 w-fit">
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
