import * as jose from "jose";
import { prisma, secretkey } from "./userlib";
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
  const session = await prisma.usersession.findUnique({
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
