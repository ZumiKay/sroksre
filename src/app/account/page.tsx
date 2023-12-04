"use client";
import { FormEvent, FormEventHandler, useState } from "react";
import Banner from "../component/Banner";
import PrimaryButton from "../component/Button";
import { Checkbox, FormControlLabel } from "@mui/material";
import { signIn } from "next-auth/react";

export default function AuthenticatePage() {
  const [type, settype] = useState("login");


  const handleSumbit = async (e:FormEvent<HTMLFormElement> ) => {
    e.preventDefault()
    alert("Hello");
  
  }
  return (
    <div className="authentication__contain flex flex-row gap-x-4 justify-between w-full min-h-[90vh] mt-4">
      <div className="banner__section w-full h-full">
        <Banner height="90vh" />
      </div>

      <form onSubmit={(e) => handleSumbit(e)} className="from__container bg-[#495464] flex text-lg flex-col justify-center items-center gap-y-10 w-full">
        <input
          type="email"
          className="email w-[80%] p-5 rounded-md"
          placeholder="Email Address"
          name="email"
          required
        />
        <input
          type="password"
          name="password"
          className="password w-[80%] p-5 rounded-md"
          placeholder="Password"
          required
        />

        {type === "register" ? (
          <>
            <input
              type="password"
              className="confirm_password w-[80%] p-5 rounded-md"
              placeholder="Confirm Password"
              required
            />
            <input
              type="text"
              className="username w-[80%] p-5 rounded-md"
              placeholder="Username"
              required
            />
            <FormControlLabel
              control={<Checkbox className="checkbox w-fit" />}
              label=<h3 className="text-white">
                {" "}
                Agree to policy and agreement{" "}
              </h3>
            />
            <div className="form_actions flex flex-col gap-y-5 w-[80%] ">
              <PrimaryButton
                text="Create Account"
                type="submit"
                color="#3D788E"
                width="100%"
                height="70px"
                radius="10px"
              />
              <PrimaryButton
                type="button"
                text="Back"
                color="#F08080"
                width="100%"
                height="70px"
                radius="10px"
                onClick={() => settype("login")}
              />
            </div>
          </>
        ) : (
          <>
            <label className="text-md font-normal text-sm relative -right-[28%] underline text-white hover:text-black">
              Forget Password?
            </label>
            <div className="form_actions flex flex-col gap-y-5 w-[80%] ">
              <PrimaryButton
                type="submit"
                text="Login"
                color="#438D86"
                width="100%"
                height="70px"
                radius="10px"
              />
             
              <PrimaryButton
                type="button"
                text="Register"
                color="#3D788E"
                width="100%"
                height="70px"
                radius="10px"
                onClick={() => settype("register")}
              />
              <PrimaryButton
                type="button"
                text="Signin with Discord"
                width="100%"
                height="70px"
                radius="10px"
                onClick={() => signIn("discord")}
              />
            </div>
          </>
        )}
      </form>
    </div>
  );
}
