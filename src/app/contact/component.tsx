"use client";
import { TextField } from "@mui/material";
import PrimaryButton from "../component/Button";
import { ChangeEvent, FormEvent, useState } from "react";
import { contacttype, SendInquiry } from "./action";
import { successToast } from "../component/Loading";

export const ContactForm = () => {
  const [contactdata, setcontact] = useState<contacttype | undefined>(
    undefined
  );
  const [loading, setloading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setloading(true);

    console.log(contactdata);
    if (contactdata) {
      const send = SendInquiry.bind(null, contactdata);
      const makereq = await send();
      successToast(makereq.message);
    }
    setloading(false);
    setcontact({
      fullname: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value, name } = e.target;

    setcontact((prev) => ({ ...prev, [name]: value } as any));
  };
  return (
    <form onSubmit={handleSubmit} className="w-full h-fit grid gap-y-10">
      <h2 className="text-2xl font-bold w-full h-fit">Send an inquiry</h2>
      <p>
        Please include order id if it related to any order. (if you need to show
        us image please send us by email instead)
      </p>
      <p>Once Inquiry is sent we will get back to you through email.</p>
      <TextField
        type="text"
        placeholder="Order Name"
        label="Order Id"
        name="orderid"
        value={contactdata?.orderid}
        onChange={handleChange}
      />
      <TextField
        type="text"
        placeholder="Fullname"
        label="Full name"
        name="fullname"
        onChange={handleChange}
        value={contactdata?.fullname}
        required
      />
      <TextField
        type="email"
        placeholder="Email Address"
        label="Email"
        name="email"
        onChange={handleChange}
        value={contactdata?.email}
        required
      />
      <TextField
        type="text"
        placeholder="Request Refund , Order Problem, Shipping Problem"
        label="Subject"
        name="subject"
        value={contactdata?.subject}
        onChange={handleChange}
        required
      />

      <textarea
        placeholder="Message"
        value={contactdata?.message}
        name="message"
        className="border-2 border-gray-400 min-h-[100px] p-1"
        onChange={handleChange}
        required
      />

      <PrimaryButton
        type="submit"
        status={loading ? "loading" : "authenticated"}
        text="Submit"
        disable={!contactdata}
        radius="10px"
      />
    </form>
  );
};
