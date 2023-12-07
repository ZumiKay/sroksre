import * as jose from "jose";
import { z } from "zod";
import { compare, genSaltSync, hashSync } from "bcryptjs";
import Prisma from "./prisma";
import { userdata } from "../app/account/actions";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
}
export interface RegisterUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}
export const secretkey = new TextEncoder().encode(
  process.env.JWT_SECRET as string,
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

export const checkpassword = (password: string) => {
  const error: string[] = [];
  let isValid = true;
  if (password.length < 8) {
    isValid = false;
    error.push("Password Need to be aleast 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    isValid = false;
    error.push("Password Need to contains aleast on upppercase letter");
  }
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    isValid = false;
    error.push("Password need to contain at least one special characters");
  }
  return { isValid, error };
};

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
export const userlogin = async (credentail: userdata) => {
  try {
    const user = await Prisma.user.findUnique({
      where: {
        email: credentail.email,
      },
    });
    if (user) {
      const isValid = await compare(
        credentail.password as string,
        user.password,
      );
      if (isValid) {
        const session = await Prisma.usersession.create({
          data: {
            user_id: user.id,
          },
        });
        if (session) {
          return {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            id: user.id,
            sessionid: session.session_id,
          };
        } else {
          throw new Error("Can't Create Session");
        }
      } else {
        throw new Error("Incorrect Credential");
      }
    } else {
      throw new Error("User Not Found");
    }
  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
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
      const isUser = await Prisma.user.findUnique({
        where: { email: data.email },
      });
      if (!isUser) {
        const user = await Prisma.user.create({
          data: {
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            password: password,
          },
        });
        if (user) {
          return true;
        } else {
          return new Error("Error Occured");
        }
      } else {
        return new Error("Email Already Been Used");
      }
    } else {
      return new Error(JSON.stringify(isValid.isValid));
    }
  } catch (error: any) {
    if (error.issues) {
      return new Error(error.issues[0].message);
    } else {
      return new Error(error as string);
    }
  } finally {
    await Prisma.$disconnect();
  }
};

export const handleEmail = () => {};
