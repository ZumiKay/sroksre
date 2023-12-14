"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import Banner from "../component/Banner";
import PrimaryButton from "../component/Button";
import { Checkbox, FormControlLabel } from "@mui/material";
import { signIn } from "next-auth/react";
import { userdata } from "./actions";
import { postRequest } from "@/src/lib/utilities";
import { errorToast, successToast } from "../component/Loading";
import { redirect } from "next/navigation";

export default function AuthenticatePage() {
  const [type, settype] = useState("login");
  const [loading, setloading] = useState<
    "authenticated" | "loading" | "unauthenticated"
  >("unauthenticated");
  const [data, setdata] = useState<userdata>({
    email: "",
    password: "",
    agreement: false,
  });
  const handleSumbit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (type === "login") {
      setloading("loading");
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      }).then((res) => {
        setloading("authenticated");
        if (res?.ok) {
          successToast("Logged In");
          redirect("/dashboard");
        }
        if (res?.error) {
          console.log(res);
          errorToast(res.error);
        }
      });
    } else {
      if (data.password === data.confirmpassword && data.agreement) {
        setloading("loading");

        const request = await postRequest("/api/auth/register", data);
        console.log(request);
        request && setloading("authenticated");

        if (request.status === 500) {
          const error = request.message;
          if (error === "false") {
            errorToast("Invalid Password");
          } else {
            errorToast(request.message);
          }
        } else if (request.message === "Registered") {
          successToast("Account Registered");
          settype("login");
        }
      } else if (!data.agreement) {
        errorToast("Please Check Our Policy");
      } else {
        errorToast("Invalid Confirm Passwords");
      }
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name, checked } = e.target;
    setdata({ ...data, [name]: name === "agreement" ? checked : value });
  };

  return (
    <div className="authentication__container flex flex-row gap-x-4 justify-between w-full min-h-[90vh] mt-4">
      <div className="banner__section w-full h-full">
        <Banner height="100vh" />
      </div>

      <form
        onSubmit={handleSumbit}
        className="from__container bg-[#495464] flex text-lg flex-col justify-center items-center gap-y-10 w-full h-[100vh]"
      >
        <input
          type="email"
          className="email w-[80%] p-3 rounded-md"
          placeholder="Email Address"
          name="email"
          onChange={handleChange}
          required
        />
        <div className="w-full flex flex-col items-center justify-center ">
          {type === "register" &&
            data.password &&
            data.password?.length < 8 && (
              <span className="text-sm font-bold text-red-300">
                {" "}
                Password Need to contains at least one Uppercase, Special
                Character and has 8 in length{" "}
              </span>
            )}
          <input
            type="password"
            name="password"
            className="password w-[80%] p-3 rounded-md"
            placeholder="Password"
            onChange={handleChange}
            required
          />
        </div>

        {type === "register" ? (
          <>
            <input
              type="password"
              name="confirmpassword"
              className="confirm_password w-[80%] p-3 rounded-md"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
            />
            <input
              type="text"
              className="username w-[80%] p-3 rounded-md"
              placeholder="Firstname"
              name="firstname"
              onChange={handleChange}
              required
            />
            <input
              type="text"
              className="username w-[80%] p-3 rounded-md"
              placeholder="Lastname"
              name="lastname"
              onChange={handleChange}
              required
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={data.agreement}
                  onChange={handleChange}
                  className="checkbox w-fit"
                  name="agreement"
                />
              }
              label=<h3
                className="text-white"
                style={{ color: data.agreement ? "white" : "pink" }}
              >
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
                status={loading}
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
                status={loading}
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
              <div className="signinWith__container w-full flex flex-row justify-between items-center gap-x-2">
                <PrimaryButton
                  type="button"
                  text="Signin with Discord"
                  width="50%"
                  color="black"
                  height="70px"
                  radius="10px"
                  Icon={<i className="fa-brands fa-discord text-blue-900"></i>}
                  onClick={() => signIn("discord")}
                />
                <PrimaryButton
                  type="button"
                  text="Signin with Gmail"
                  hoverColor="black"
                  hoverTextColor="white"
                  width="50%"
                  height="70px"
                  color="white"
                  textcolor="black"
                  radius="10px"
                  onClick={() => signIn("google")}
                  Icon={<i className="fa-brands fa-google text-red-600"></i>}
                />
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
