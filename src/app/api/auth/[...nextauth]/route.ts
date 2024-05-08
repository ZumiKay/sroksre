import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialProvider from "next-auth/providers/credentials";
import { handleCheckandRegisterUser, userlogin } from "@/src/lib/userlib";
import { NextAuthOptions } from "next-auth";
import {
  checkloggedsession,
  generateRandomPassword,
} from "@/src/lib/utilities";
import { Role } from "@prisma/client";
import { signOut } from "next-auth/react";
import Prisma from "@/src/lib/prisma";
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "../../../account/page.tsx",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 48,
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GMAIL_CLIENTID as string,
      clientSecret: process.env.GMAIL_CLIENTSECRET as string,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENTID as string,
      clientSecret: process.env.DISCORD_CLIENTSECRET as string,
    }),

    CredentialProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentails: any): Promise<any> {
        if (!credentails.email || !credentails.password) {
          return null;
        }
        const login = await userlogin(credentails);
        if (!login.success) {
          return null;
        } else {
          return login.data;
        }
      },
    }),
  ],
  callbacks: {
    async signIn(param): Promise<any> {
      if (param.user.id) {
        const checkuser = await handleCheckandRegisterUser({
          id: param.user.id,
          data: {
            firstname: param.user.name as string,
            email: param.user.email as string,
            password: generateRandomPassword(),
          },
        });
        if (!checkuser.success) {
          return false;
        }
      }
      return true;
    },

    async jwt(params): Promise<any> {
      const uid = params.token?.sub;

      const getRole = await Prisma.user.findUnique({
        where: { id: uid },
        select: { role: true },
      });

      let modifiedtoken = {
        ...params.token,
        ...{ ...params.user, role: getRole?.role },
      };

      return modifiedtoken;
    },
    async session(params): Promise<any> {
      //checksesstion
      const verified = await checkloggedsession(params.token.sub as string);

      if (verified.success) {
        let modifieddata = { ...params.token };
        if (modifieddata.jti || modifieddata.exp || modifieddata.iat) {
          delete modifieddata.jti;
          delete modifieddata.exp;
          delete modifieddata.iat;
        }
        if (!modifieddata.role) {
          modifieddata.role = Role.USER;
        }

        params.session.user = { ...modifieddata };

        return params.session;
      }
      await signOut();
      return null;
    },
  },
};
const Nextauth = NextAuth(authOptions);
export { Nextauth as GET, Nextauth as POST };
