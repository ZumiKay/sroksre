import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialProvider from "next-auth/providers/credentials";
import { userdata } from "@/src/app/account/actions";
import { userlogin } from "@/src/lib/userlib";
import { NextAuthOptions } from "next-auth";
import { User } from "@prisma/client";
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "../../../account/page.tsx",
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
      async authorize(credentails: userdata | any): Promise<any> {
        const login = await userlogin(credentails);
        return login;
      },
    }),
  ],
  callbacks: {
    async jwt(params) {
      const user = params.user as unknown as User;
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user && user.firstname && user.lastname && user.role) {
        params.token.userid = user.id;
        params.token.role = user.role;
        params.token.name = user.firstname + "," + user.lastname;
      } else {
        params.token.role = "USER";
      }

      return params.token;
    },
    async session({ session, token }) {
      if (session.user && session.user.name) {
        session.user.name = token.name;
      }

      return session;
    },
  },
  jwt: {
    maxAge: 60 * 60,
  },
};
const Nextauth = NextAuth(authOptions);
export { Nextauth as GET, Nextauth as POST };
