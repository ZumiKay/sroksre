import Emailicon from "../../../public/Image/Mail1.png";
import Fbicon from "../../../public/Image/Facebook1.png";
import Igicon from "../../../public/Image/Instagram01.png";
import Phoneicon from "../../../public/Image/Phone.png";

import { ContactForm } from "./component";
import { Suspense } from "react";
import LoadingIcon from "../component/Loading";
import Image from "next/image";

const ContactItems = [
  { icon: Igicon, value: "SrokSreStore" },
  { icon: Fbicon, value: "SrokSre" },
  { icon: Emailicon, value: "sroksreecomerce" },
  { icon: Phoneicon, value: "023880880" },
];
export default async function ContactPage() {
  return (
    <div className="w-[70%] h-full min-h-screen pl-10 flex flex-col gap-y-20">
      <h2 className="text-5xl font-bold w-full h-fit">Contact Us</h2>

      <div className="info_table w-[300px] h-[350px] bg-[#CFDBEE] p-2 flex flex-col gap-y-7 rounded-lg">
        {ContactItems.map((i) => (
          <div
            key={ContactItems.indexOf(i)}
            className="info w-full h-fit p-2 flex flex-row gap-x-5 justify-between items-center"
          >
            <Image
              src={i.icon}
              alt="social_icon"
              className="w-[45px] h-[45px] object-contain rounded-lg"
              loading="eager"
            />
            <p className="text-lg font-bold">{i.value}</p>
          </div>
        ))}
      </div>
      <Suspense fallback={<LoadingIcon />}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
