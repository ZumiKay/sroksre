import * as jose from "jose";
import { date, z } from "zod";
import { compare, genSaltSync, hashSync } from "bcryptjs";
import Prisma from "./prisma";
import { userdata } from "../app/account/actions";
import nodemailer from "nodemailer";
import { checkpassword, normalemailtemplate } from "./utilities";

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
  } finally {
    await Prisma.$disconnect();
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
  } finally {
    await Prisma.$disconnect();
  }
  //delete session
};
export const registerUser = async (data: RegisterUser) => {
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
      const user = await Prisma.user.update({
        where: { id: data.id },
        data: { ...datatosave, vfy: null },
      });
      if (user) {
        return true;
      } else {
        return new Error("Error Occured");
      }
    } else {
      return new Error(isValid.error);
    }
  } catch (error: any) {
    console.log("Register", error);
    if (error.issues) {
      return new Error(error.issues[0].message);
    } else {
      return new Error(error as string);
    }
  } finally {
    await Prisma.$disconnect();
  }
};
interface Emaildata {
  to: string;
  subject: string;
  message: string;
  warn: string;
  title?: string;
}
export const handleEmail = async (data: Emaildata) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_APPKEY,
    },
  });
  const mailoptions = {
    from: `SrokSre <${process.env.EMAIL}>`,
    to: `<${data.to}>`,
    subject: data.subject,
    html: normalemailtemplate(data.warn, data.title ?? "", data.message),
  };
  try {
    await transporter.sendMail(mailoptions);
    return { sucess: true };
  } catch (error) {
    console.log("Send Email", error);
    return { success: true };
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
      return { success: true, message: "User already exists" };
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
  } finally {
    await Prisma.$disconnect();
  }
};
