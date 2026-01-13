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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
      const { token, user, account } = params;

      // Initial sign in - user object is available
      if (user) {
        const userData = user as any;
        let tokenData = {
          email: userData.email,
          session_id: userData.sessionid,
          role: userData.role,
          id: userData.id,
          name: userData.name,
        };

        // Handle OAuth providers
        if (account?.provider && account.provider !== "credentials") {
          const oauthUser = await getOAuthInfo(userData.id, userData.email);
          tokenData = {
            ...tokenData,
            id: oauthUser?.id,
            role: oauthUser?.role,
            session_id: oauthUser.session_id,
          };
        }

        return { ...token, ...tokenData };
      }

      // Subsequent requests - return existing token
      return token;
    },
    async session(params): Promise<any> {
      let { session, token } = params;

      const jwtToken = token as unknown as JwtType;

      // Ensure user data from token is added to session
      if (
        session &&
        jwtToken &&
        jwtToken.email &&
        jwtToken?.id &&
        jwtToken?.session_id
      ) {
        // Verify session exists in database (but don't return null to avoid infinite loop)
        try {
          const dbSession = await Prisma.usersession.findUnique({
            where: {
              session_id: jwtToken.session_id,
            },
          });

          // If session doesn't exist or is expired, set user to null but still return session
          // This prevents infinite loops while still invalidating the session
          if (!dbSession || dbSession.expireAt < new Date()) {
            console.log("Session invalid or expired:", {
              exists: !!dbSession,
              expired: dbSession ? dbSession.expireAt < new Date() : null,
              session_id: jwtToken.session_id,
            });

            // Return session with null user to trigger client-side logout
            return {
              ...session,
              user: null,
              expires: new Date(0).toISOString(), // Set to expired
            };
          }
        } catch (error) {
          console.error("Error verifying session:", error);
          // On error, allow session to continue to prevent infinite loops
        }

        // Session is valid, populate user data
        (session.user as any) = {
          email: jwtToken.email,
          name: jwtToken.name,
          session_id: jwtToken.session_id || "",
          role: jwtToken.role || "USER",
          id: jwtToken.id,
        };
      } else {
        console.warn("Session callback: Invalid or incomplete token", {
          hasToken: !!jwtToken,
          hasEmail: !!jwtToken?.email,
          hasId: !!jwtToken?.id,
        });
      }

      return session;
    },
  },
};
const Nextauth = NextAuth(authOptions);
export { Nextauth as GET, Nextauth as POST };
