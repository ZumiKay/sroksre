import * as jose from "jose";
import { secretkey } from "./userlib";
import Prisma from "./prisma";
export const protectedRoutes = {
  user: {
    routes: ["logout"],
  },
  editor: {
    routes: [""],
  },
  admin: {
    routes: [""],
  },
};
export const verifyToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, secretkey);
  return payload;
};
export const verifySession = async (sessionid: string) => {
  const session = await Prisma.usersession.findUnique({
    where: {
      session_id: sessionid,
    },
  });
  if (session) {
    return true;
  } else {
    return true;
  }
};
