import * as jose from "jose";
import { z } from "zod";
import { genSaltSync, hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
export const prisma = new PrismaClient();

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
  if (!/[a-z]/.test(password)) {
    isValid = false;
    error.push("Password need to contains alease one lowercase letter");
  }
  if (!/\d/.test(password)) {
    isValid = false;
    error.push("Password need to contain atleast one number");
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

export const handleEmail = () => {};
