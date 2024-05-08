import * as jose from "jose";
import { z } from "zod";
import { compare, genSaltSync, hashSync } from "bcryptjs";
import Prisma from "./prisma";
import { userdata } from "../app/account/actions";

import { checkpassword } from "./utilities";
import { handleEmail } from "../app/checkout/action";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
}
export interface RegisterUser {
  id?: string;
  firstname: string;
  email: string;
  password: string;
  lastname?: string;
  role?: Role;

  phonenumber?: string;
}
export const secretkey = new TextEncoder().encode(
  process.env.JWT_SECRET as string
);
export async function createToken(payload: {
  userid: number;
  sessionid: string;
}) {
  const alg = "HS256";
  const token = await new jose.SignJWT({
    userid: payload.userid,
    sessionid: payload.sessionid,
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretkey);
  return token;
}

export const validateUserInput = z.object({
  firstname: z.string().max(50),
  lastname: z.string().max(50),
  email: z.string().email(),
});
export const hashedpassword = (password: string) => {
  const saltround = 10;
  const salt = genSaltSync(saltround);
  const hashedpassword = hashSync(password, salt);
  return hashedpassword;
};
export const verfyUserLoginInput = z.object({
  email: z.string().email(),
  password: z.string(),
});
export const userlogin = async (
  credentail: userdata
): Promise<{ success: boolean; data?: userdata; message?: string }> => {
  try {
    const user = await Prisma.user.findUnique({
      where: {
        email: credentail.email,
      },
    });
    if (user) {
      const isValid = await compare(
        credentail.password as string,
        user.password
      );
      if (isValid) {
        const session = await Prisma.usersession.create({
          data: {
            user_id: user.id,
          },
        });
        if (session) {
          return {
            success: true,
            data: {
              id: user.id as string,
              role: user.role,
              sessionid: session.session_id,
            },
          };
        } else {
          console.log("Can't Create Session");
          return { success: false };
        }
      } else {
        console.log("Can't Find User");
        return { success: false, message: "Incorrect Information" };
      }
    } else {
      return { success: false, message: "Incorrect Information" };
    }
  } catch (error: any) {
    console.log("Login", error);
    return { success: false, message: "Error Occured" };
  }
};
export const logout = async (sessionid: string) => {
  try {
    await Prisma.usersession.delete({
      where: {
        session_id: sessionid,
      },
    });
    return true;
  } catch (error) {
    console.log("Session Error", error);
    throw new Error("Error Occured");
  }
  //delete session
};

interface ReturnType {
  success: boolean;
  message?: string;
}
export const registerUser = async (data: RegisterUser): Promise<ReturnType> => {
  try {
    validateUserInput.parse(data);
    const isValid = checkpassword(data.password);
    if (isValid.isValid) {
      const password = hashedpassword(data.password);
      const datatosave = {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname ?? null,
        password: password,
      };
      //verify email

      if (!data.id) {
        await Prisma.user.create({ data: { ...datatosave } });
      } else {
        await Prisma.user.update({
          where: { id: data.id },
          data: { ...datatosave, vfy: null },
        });
      }

      return { success: true };
    } else {
      return { success: false, message: isValid.error };
    }
  } catch (error: any) {
    console.log("Register", error);
    if (error.issues) {
      return { success: false, message: error.issues[0].message };
    }
    return { success: false };
  }
};

export const handleCheckandRegisterUser = async ({
  id,
  data,
}: {
  id: string;
  data: RegisterUser;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const existingUser = await Prisma.user.findUnique({ where: { id } });

    if (existingUser) {
      return { success: true };
    }
    let plainpassword = data.password;

    const hashedPassword = hashedpassword(data.password);
    data.password = hashedPassword;

    const createdUser = await Prisma.user.create({
      data: {
        ...data,
        id: id,
        sessions: {
          create: {},
        },
      },
    });

    if (!createdUser) {
      return { success: false, message: "Failed to create user" };
    }
    await handleEmail({
      warn: "Your email will be only use for this time unless you subscribe to our newletter",
      to: createdUser.email,
      subject: "Login Information",
      title: "For Login As Credentials",
      message: `Password: ${plainpassword} <br/>`,
    });

    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Register User", error);
    return {
      success: false,
      message: "An error occurred during user registration",
    };
  }
};
