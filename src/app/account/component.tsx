import { userdata } from "@/src/context/GlobalType.type";
import { PasswordInput } from "../component/FormComponent";
import { logintype, PasswordVerification } from "./page";
import RecapchaContainer from "../component/RecaphaComponent";
import { Button, Checkbox, Input, InputOtp } from "@heroui/react";
import { Userinitialize } from "@/src/context/GlobalContext";
import PrimaryButton from "../component/Button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UserInputComponentProps {
  data?: userdata;
  handleChange: (name: string, value: any) => void;
}

export const RegisterUserForm = ({
  data,
  handleChange,
}: UserInputComponentProps) => {
  return (
    <div className="register_form w-full h-fit">
      <input
        type="text"
        className="username w-[80%] p-3 rounded-md"
        placeholder="Firstname"
        name="firstname"
        value={data?.firstname}
        onChange={({ target }) => handleChange(target.name, target.value)}
        required
      />
      <input
        type="text"
        className="username w-[80%] p-3 rounded-md"
        placeholder="Lastname"
        name="lastname"
        value={data?.lastname}
        onChange={({ target }) => handleChange(target.name, target.value)}
        required
      />
      <div className="w-full flex flex-col gap-y-2 items-center justify-center ">
        <PasswordInput
          name="password"
          label="Password"
          type="auth"
          width="80%"
          onChange={({ target }) => handleChange(target.name, target.value)}
          isRequired
        />
      </div>
      <PasswordInput
        name="confirmpassword"
        label="Confirm Password"
        width="80%"
        type="auth"
        onChange={({ target }) => handleChange(target.name, target.value)}
        isRequired
      />
      <div className="w-[80%] h-fit">
        <PasswordVerification password={data?.password ?? ""} />
      </div>

      <RecapchaContainer
        captchaValue={data?.recapcha ?? null}
        setcaptchaValue={(value) => handleChange("recapcha", value)}
      />
      <div className="w-[80%] h-fit">
        <Checkbox
          checked={data?.agreement}
          onChange={(val) => {
            handleChange("agreement", val.target.checked);
          }}
        >
          <strong className="text-white"> Agree to </strong>
          <a
            href="/privacyandpolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            terms and conditions
          </a>
        </Checkbox>
      </div>
    </div>
  );
};

interface VerifyEmailProps extends UserInputComponentProps {
  isVerify: boolean;
}

export const VerfyEmailComponent = ({
  handleChange,
  data,
  isVerify,
}: VerifyEmailProps) => {
  return !isVerify ? (
    <Input
      type="email"
      name="email"
      size="lg"
      label="Email"
      placeholder="Email Address"
      value={data?.email}
      onChange={({ target }) => handleChange(target.name, target.value)}
      isRequired
    />
  ) : (
    <InputOtp
      length={6}
      value={data?.cid}
      onValueChange={(val) => handleChange("cid", val)}
    />
  );
};

interface LoginComponentProps extends UserInputComponentProps {
  settype: (val: string) => void;
  setdata: (val: userdata) => void;
  handleConfirm: (types: "email" | "cid") => Promise<void>;
  type: logintype;
  loading: boolean;
}
export const LoginComponent = ({
  handleChange,
  settype,
  setdata,
  loading,
  data,
  handleConfirm,
  type,
}: LoginComponentProps) => {
  const router = useRouter();
  const servicesSignIn = useCallback(
    async (type: "google" | "discord") => {
      const res = await signIn(type);
      if (res?.ok) {
        router.replace("/dashboard");
        router.refresh();
      }
    },
    [router]
  );

  return (
    <div className="login_container w-[50%] h-fit flex flex-col gap-y-10 items-end">
      <Input
        type="email"
        name="email"
        size="lg"
        label="Email"
        className="h-[55px]"
        radius="sm"
        placeholder="Email Address"
        value={data?.email}
        onChange={({ target }) => handleChange(target.name, target.value)}
        isRequired
      />
      {type === "login" && (
        <>
          <div className="h-full flex justify-start w-full max-small_phone:w-[103%]">
            <PasswordInput
              label="Password"
              placeholder="Password"
              type="auth"
              name="password"
              onChange={({ target }) => handleChange(target.name, target.value)}
              width="100%"
              isRequired
            />
          </div>

          <div
            onClick={() => {
              settype("forget");
            }}
            className="w-fit text-lg underline text-right text-white cursor-pointer hover:text-black active:text-black"
          >
            Forget Password?
          </div>
          <div className="form_actions flex flex-col gap-y-5 w-full items-end">
            <Button
              className="bg-[#438D86] w-full text-white font-bold"
              size="md"
              type="submit"
              isLoading={loading}
            >
              Login
            </Button>
            <div
              onClick={() => {
                setdata(Userinitialize);
                settype("register");
              }}
              className="w-fit text-right text-lg font-medium underline text-white cursor-pointer hover:text-black active:text-black"
            >
              Create Account ?
            </div>
            <label className="text-lg font-bold text-white w-full text-left">
              Sign with:{" "}
            </label>
            <div className="signinWith__container w-full flex flex-row items-center gap-x-2 gap-y-5 max-large_phone:flex-col">
              <PrimaryButton
                type="button"
                text="Discord"
                width="250px"
                color="black"
                height="50px"
                radius="10px"
                Icon={
                  <i className="fa-brands fa-discord text-lg text-blue-900"></i>
                }
                onClick={() => servicesSignIn("discord")}
              />
              <PrimaryButton
                type="button"
                text="Gmail"
                hoverColor="black"
                hoverTextColor="white"
                width="250px"
                height="50px"
                color="white"
                textcolor="black"
                radius="10px"
                onClick={() => servicesSignIn("google")}
                Icon={
                  <i className="fa-brands fa-google text-lg text-red-600"></i>
                }
              />
            </div>
          </div>
        </>
      )}

      {type === "forget" && (
        <div className="w-full h-fit flex flex-row gap-x-5 items-end">
          <Button
            onPress={() => handleConfirm("email")}
            className="w-full bg-[#3D788E] text-white"
            type="button"
            size="md"
            isLoading={loading}
          >
            Verify
          </Button>
          <Button
            isDisabled={loading}
            className="w-full font-bold text-white"
            color="secondary"
            onPress={() => settype("login")}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
};
