import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialProvider from "next-auth/providers/credentials";
import {
  getOAuthInfo,
  handleCheckandRegisterUser,
  userlogin,
} from "@/src/lib/userlib";
import { NextAuthOptions } from "next-auth";
import { generateRandomPassword } from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma";
import { JwtType, userdata, Usersessiontype } from "@/src/types/user.type";
import { Role } from "@/prisma/generated/prisma/enums";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/account",
    error: "/account",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
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
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentails): Promise<any> {
        if (!credentails?.email || !credentails?.password) {
          return null;
        }

        const login = await userlogin(credentails as never);
        if (!login.success) {
          return null;
        }

        return {
          id: login.data?.id,
          sessionid: login.data?.sessionid,
          role: login.data?.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn(param): Promise<any> {
      //Handle Oauth0 authentication (Google, Discord)
      if (param.account?.provider !== "credentials") {
        const checkuser = await handleCheckandRegisterUser({
          data: {
            firstname: param.user.name as string,
            email: param.user.email as string,
            password: generateRandomPassword(),
            type: param.account?.provider,
            oauthId: param.user.id,
          },
        });
        if (!checkuser.success) {
          return false;
        }
      }

      return true;
    },

    async jwt(params): Promise<any> {
      const { token, user, account } = params;

      //Only avaliable when just sign in trigger
      const loggedUser = user as unknown as userdata;

      // Initial sign in - user object is available
      if (user) {
        // Handle OAuth providers
        if (account?.provider && account.provider !== "credentials") {
          console.log("Processing OAuth login for:", user.email);
          const oauthUser = await getOAuthInfo(user.id, user.email as string);

          if (!oauthUser || !oauthUser.session_id) {
            console.error("Failed to create OAuth session for:", user.email);
            return {
              ...token,
              isExpired: true,
            };
          }

          console.log(
            "OAuth session created successfully:",
            oauthUser.session_id,
          );
          //Prepare tokendata for OAuth
          return {
            ...token,
            email: user.email,
            sessionid: oauthUser.session_id,
            role: oauthUser.role,
            id: oauthUser.id,
            firstname: user.name,
            lastname: "",
          };
        }

        // Handle credentials provider
        if (loggedUser && loggedUser.sessionid) {
          return {
            ...token,
            sessionid: loggedUser.sessionid,
            role: loggedUser.role,
            id: loggedUser.id,
          };
        }
        return null;
      }
      //after signed in - verify session is still valid
      else if (token) {
        const userToken = token as unknown as JwtType;
        //verify user session
        const dbSession = await Prisma.usersession.findUnique({
          where: {
            session_id: userToken.sessionid,
          },
        });

        // If session doesn't exist or is expired, mark it in the token
        if (!dbSession || dbSession.expireAt < new Date()) {
          return {
            ...token,
            isExpired: true,
          };
        }
      }

      return token;
    },
    async session(params): Promise<any> {
      let { session, token } = params;
      const userToken = token as unknown as JwtType;

      if (userToken) {
        // Check if token is marked as expired
        if ((token as any).isExpired) {
          (session as any).isExpired = true;
          session.expires = "0";
        }

        const usersession = session as unknown as Usersessiontype;
        usersession.sessionid = userToken.sessionid as string;
        usersession.id = userToken.id as number;
        usersession.role = userToken.role as Role;

        return usersession;
      }
      return session;
    },
  },
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
