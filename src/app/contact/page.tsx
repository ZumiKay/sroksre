import Emailicon from "../../../public/Image/Mail1.png";
import Fbicon from "../../../public/Image/Facebook1.png";
import Igicon from "../../../public/Image/Instagram01.png";
import Phoneicon from "../../../public/Image/Phone.png";

import { ContactForm } from "./component";
import { Suspense } from "react";
import LoadingIcon from "../component/Loading";
import Image from "next/image";
import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Metadata } from "next";
export function generateMetadata(): Metadata {
  return {
    title: "Contact | SrokSre",
    description:
      "Ask question , send inquiry to us through email from the form",
  };
}
const ContactItems = [
  { icon: Igicon, value: process.env.NEXT_PUBLIC_ADMIN_IG },
  { icon: Fbicon, value: process.env.NEXT_PUBLIC_ADMIN_FB },
  {
    icon: Emailicon,
    value: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    type: "Email",
  },
  { icon: Phoneicon, value: process.env.NEXT_PUBLIC_ADMIN_PHONENUMBER },
];
export default async function ContactPage() {
  const user = await getUser();
  const userdata =
    user && (await Prisma.user.findUnique({ where: { id: user?.id } }));
  return (
    <div className="w-[70%] max-large_phone:w-[95%] h-full min-h-screen pl-10 max-smallest_phone:pl-2 flex flex-col gap-y-20">
      <h2 className="text-5xl font-bold w-full h-fit">Contact Us</h2>

      <div className="info_table w-fit h-[350px] max-smallest_phone:w-[250px] max-smallest_phone:h-[350px] bg-[#CFDBEE] p-2 flex flex-col gap-y-7 rounded-lg">
        {ContactItems.map((i) => (
          <div
            key={ContactItems.indexOf(i)}
            className="info w-full h-fit p-2 flex flex-row gap-x-5 justify-between items-center"
          >
            <Image
              src={i.icon}
              alt="social_icon"
              className="w-[45px] h-[45px] object-contain rounded-lg"
              loading="lazy"
            />
            {i.type === "Email" ? (
              <a className="text-lg font-bold" href={`mailto:${i.value}`}>
                {i.value}
              </a>
            ) : (
              <p className="text-lg font-bold">{i.value}</p>
            )}
          </div>
        ))}
      </div>
      <Suspense fallback={<LoadingIcon />}>
        <ContactForm
          email={userdata?.email}
          fullname={
            userdata
              ? `${userdata?.firstname ?? ""} ${userdata?.lastname ?? ""}`
              : undefined
          }
        />
      </Suspense>
    </div>
  );
}
