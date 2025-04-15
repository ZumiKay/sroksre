/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getOAuthInfo,
  handleCheckandRegisterUser,
  userlogin,
} from "@/src/lib/userlib";
import { generateRandomPassword } from "@/src/lib/utilities";

interface JwtType {
  name: string;
  email: string;
  session_id: string;
  picture?: string;
  image?: string;
  id: number;
  role: "ADMIN" | "USER" | "EDITOR";
  iat: number;
  exp: number;
  jti: string;
}

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: "../../../account",
    error: "/error",
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials: any): Promise<any> {
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const login = await userlogin(credentials);
        if (!login.success) {
          return null;
        }

        return login.data;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }): Promise<boolean> {
      if (account?.provider !== "credentials") {
        const checkuser = await handleCheckandRegisterUser({
          data: {
            firstname: user.name as string,
            email: user.email as string,
            password: generateRandomPassword(),
            type: account?.provider,
            oauthId: user.id,
          },
        });
        if (!checkuser.success) {
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (token) {
        const typedUser = user as any;
        const jwt = token as unknown as JwtType;

        let updatedToken = {
          ...token,
          email: typedUser?.email ?? jwt.email,
          session_id: typedUser?.sessionid ?? jwt.session_id,
          role: typedUser?.role ?? jwt.role,
          id: typedUser?.id ?? jwt.id,
        };

        if (account?.provider && account.provider !== "credentials") {
          const oauthUser = await getOAuthInfo(typedUser.id, typedUser.email);

          updatedToken = {
            ...updatedToken,
            id: oauthUser?.id,
            role: oauthUser?.role,
            session_id: oauthUser.session_id,
          };
        }

        return updatedToken;
      }
      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          session_id: token.session_id,
        },
      };
    },
  },
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
