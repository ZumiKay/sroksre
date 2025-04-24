"use client";
import { Button, Divider, Form, Input } from "@heroui/react";
import { redirect, useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  use,
} from "react";
import { PasswordSection } from "../component";
import { getBaseUrl, IsNumber } from "@/src/lib/utilities";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "@/src/app/component/Loading";
import { UserState } from "@/src/context/GlobalType.type";
import { renderToString } from "react-dom/server";
import { CredentialEmail } from "@/src/app/component/EmailTemplate";
import { SendVfyEmail } from "@/src/app/account/actions";

const FetchUser = async (id: number) => {
  const makereq = await ApiRequest({
    url: `/api/users?search=${id}`,
    method: "GET",
  });

  if (!makereq.success) {
    return null;
  }

  return makereq.data;
};

const CreateUserPage = (props: { params: Promise<{ id?: string }> }) => {
  const params = use(props.params);
  const { user, setuser, setglobalindex } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const isEdit = useMemo(() => params.id && Number(params.id) > 0, [params.id]);
  const router = useRouter();

  useEffect(() => {
    if (!params.id || !IsNumber(params.id)) {
      return redirect("/notfound");
    }
    if (Number(params.id) === 0)
      setuser({
        firstname: "",
        email: "",
        password: "",
        username: "",
      });
    else {
      const fetchUser = async () => {
        setloading(true);
        const userdata = await FetchUser(Number(params.id));
        setloading(false);

        if (!userdata) {
          return redirect("/notfound");
        }

        setuser(userdata as UserState);
      };
      fetchUser();
    }
  }, [params.id]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setuser((prev) => ({ ...prev, [name]: value } as never));
    },
    [setuser]
  );

  const handleCancel = useCallback(() => {
    if (isEdit) {
      setglobalindex({ useredit: -1 } as never);
    }
    router.back();
  }, [isEdit, router, setglobalindex]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (user?.password !== user?.confirmpassword) {
        errorToast("Confirm Password must match");
        return;
      }

      setloading(true);
      const makerequest = await ApiRequest({
        method: isEdit ? "PUT" : "POST",
        url: "/api/auth/register",
        data: user,
      });

      if (!makerequest.success || !makerequest.data) {
        setloading(false);
        errorToast(makerequest.error ?? "Error Occured");
        return;
      }

      //send email verification
      const template = renderToString(
        <CredentialEmail
          infotype="link"
          infovalue={`${getBaseUrl()}/account/verify?vc=${makerequest.data}`}
          message="Please Click link for verification"
          warn="For Verification Only"
        />
      );

      const sendEmail = SendVfyEmail.bind(
        null,
        template,
        user?.email as string,
        "Email Verification"
      );
      const sendReq = await sendEmail();
      setloading(false);
      if (!sendReq.success) {
        errorToast("Can't Verfiy Email");
        return;
      }

      successToast("User created");

      setuser(undefined);
    },
    [isEdit, setuser, user]
  );

  return (
    <div className="createuserpage w-[95%] h-full flex flex-col items-center gap-y-5">
      <h1 className="w-full pt-3 text-left text-4xl">
        {isEdit ? "Edit User" : "Create User"}
      </h1>
      {isEdit && !user && loading && <ContainerLoading />}
      <Form
        onSubmit={handleSubmit}
        className="createuser_form w-full h-fit flex flex-col gap-y-5"
      >
        <h3>Personal Information</h3>
        <Divider />
        <div className="name_input w-full flex flex-row items-center gap-x-3">
          <Input
            name="firstname"
            type="text"
            label="Firstname"
            labelPlacement="outside"
            value={user?.firstname}
            size="md"
            onChange={handleChange}
            isRequired
          />
          <Input
            name="lastname"
            type="text"
            label="Lastname"
            labelPlacement="outside"
            value={user?.lastname}
            size="md"
            onChange={handleChange}
          />
        </div>
        <Input
          value={user?.username}
          type="text"
          size="md"
          name="username"
          label="Username"
          labelPlacement="outside"
          onChange={handleChange}
        />
        <Input
          name="email"
          type="email"
          size="md"
          label="Email"
          labelPlacement="outside"
          value={user?.email}
          onChange={handleChange}
        />
        <h3>Security</h3>
        <Divider />
        <PasswordSection />

        <Divider />

        <div className="btn_section w-[300px] h-[40px] flex flex-row gap-x-3">
          <Button
            type="submit"
            isLoading={loading}
            size="md"
            className="bg_default text-white font-bold"
          >
            {!isEdit ? "Create" : "Update"}
          </Button>
          <Button
            onPress={() => handleCancel()}
            isDisabled={loading}
            className="font-bold bg-red-400 text-white"
            size="md"
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateUserPage;
