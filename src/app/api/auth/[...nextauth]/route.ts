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
import { Role } from "@prisma/client";

interface JwtType {
  name: string;
  email: string;
  session_id: string;
  picture?: string;
  image?: string;
  id: number;
  role: Role;
  iat: number;
  exp: number;
  jti: string;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "../../../account/page.tsx",
    error: "/error.tsx",
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
        }

        return login.data;
      },
    }),
  ],
  callbacks: {
    async signIn(param): Promise<any> {
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

      return param.user;
    },

    async jwt(params): Promise<any> {
      if (params.token) {
        let user = params?.user as any;
        const jwt = params.token as unknown as JwtType;
        let token = {
          email: user?.email ?? jwt.email,
          session_id: user?.sessionid ?? jwt.session_id,
          role: user?.role ?? jwt.role,
          id: user?.id ?? jwt.id,
        };

        if (
          params.account?.provider &&
          params.account.provider !== "credentials"
        ) {
          const oauthUser = await getOAuthInfo(user.id, user.email);

          token = {
            ...token,
            id: oauthUser?.id,
            role: oauthUser?.role,
            session_id: oauthUser.session_id,
          };
        }

        return token;
      }
      return null;
    },
    async session(params): Promise<any> {
      //checksesstion

      let session = { ...params.session };
      session.user = { ...params.token };

      return session;
    },
  },
};
const Nextauth = NextAuth(authOptions);
export { Nextauth as GET, Nextauth as POST };
