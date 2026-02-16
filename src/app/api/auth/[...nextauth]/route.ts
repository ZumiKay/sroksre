import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialProvider from "next-auth/providers/credentials";
import {
  createUniqueSessionId,
  generateExpiration,
  getOAuthInfo,
  handleCheckandRegisterUser,
  hashToken,
  userlogin,
} from "@/src/lib/userlib";
import { NextAuthOptions } from "next-auth";
import { generateRandomPassword } from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma";
import { JwtType, userdata } from "@/src/types/user.type";

/**Authentication Features
 * [✓] Credentail / Oauth (Discord , Google)
 * [✓] Email will be save for Oauth with unique OauthId (Oauth)
 * [✓] Register user will be validate data before save (Crendtial)
 * [✓] Session will manage using DB with expiration flag cexp for Client
 * [✓] Session expire in 7 days with access token expired in 15min
 * [✓] Forget password with verification of email address
 * [✓] Login attempt lockdown (Prevent Brute Force)
 *     - Max 5 failed attempts before 15-minute lockout
 *     - Tracks attempts within 30-minute window
 *     - Automatic unlock after lockout period
 */

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/account",
    error: "/account",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days expiration
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
      async authorize(credentials, req: any): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const login = await userlogin(credentials as userdata, req);
        if (!login.success || !login.data) {
          return null;
        }

        return {
          id: login.data.userId,
          sessionid: login.data.sessionid,
          role: login.data.role,
        };
      },
    }),
  ],

  //Event
  events: {
    async signOut({ token }) {
      // This runs when user signs out
      const userToken = token as unknown as JwtType;

      if (userToken?.sessionid) {
        try {
          // Delete the session from database
          const isSession = await Prisma.usersession.findUnique({
            where: { refresh_token_hash: hashToken(userToken.sessionid) },
          });
          if (isSession) {
            await Prisma.usersession.delete({
              where: {
                refresh_token_hash: hashToken(userToken.sessionid),
              },
            });
          }
          console.log("Session deleted on signout:", userToken.sessionid);
        } catch (error) {
          console.log("Error deleting session on signout:", error);
        }
      }
    },
  },

  //Callback
  callbacks: {
    async signIn({ user, account }): Promise<boolean> {
      // Handle OAuth authentication (Google, Discord)
      if (account?.provider !== "credentials" && user.email && user.name) {
        const result = await handleCheckandRegisterUser({
          data: {
            firstname: user.name,
            email: user.email,
            password: generateRandomPassword(),
            type: account?.provider,
            oauthId: user.id,
          },
        });

        if (!result.success) {
          console.log("Failed to register OAuth user:", user.email);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger }): Promise<any> {
      // Initial sign in - user object is available
      if (trigger === "signIn" && user) {
        const sessionData = user as unknown as JwtType;

        // Handle OAuth providers
        if (account?.provider && account.provider !== "credentials") {
          // For OAuth, device info is not available in this callback
          const oauthUser = await getOAuthInfo(
            user.id,
            user.email as string,
            null,
          );

          if (!oauthUser?.sessionid) {
            console.log("Failed to create OAuth session for:", user.email);
            return { ...token, isExpired: true };
          }

          return {
            ...token,
            sessionid: oauthUser.sessionid,
            id: oauthUser.id,
            role: oauthUser.role,
            email: user.email,
            name: user.name,
            cexp: generateExpiration(15, "minutes"),
          };
        }

        // Handle credentials provider
        if (sessionData.sessionid) {
          return {
            ...token,
            sessionid: sessionData.sessionid,
            id: sessionData.id || Number(user.id),
            role: sessionData.role,
            email: user.email,
            name: user.name,
            cexp: generateExpiration(15, "minutes"),
          };
        }
      }

      // Subsequent requests - verify session is still valid
      const userToken = token as unknown as JwtType;
      if (!userToken) {
        return { ...token, isExpired: true };
      }

      // Check if token is expired and needs renewal
      if (userToken.cexp && userToken.cexp * 1000 <= Date.now()) {
        try {
          const dbSession = await Prisma.usersession.findUnique({
            where: { refresh_token_hash: hashToken(userToken.sessionid) },
            select: { expireAt: true, sessionid: true },
          });

          if (!dbSession || dbSession.expireAt < new Date()) {
            return { ...token, isExpired: true };
          }

          // Generate new session ID and update
          const newSessionId = await createUniqueSessionId();
          await Prisma.usersession.update({
            where: { sessionid: dbSession.sessionid },
            data: {
              refresh_token_hash: hashToken(newSessionId),
              lastUsed: new Date(),
            },
          });

          return {
            ...token,
            cexp: generateExpiration(15, "minutes"),
            sessionid: newSessionId,
          };
        } catch (error) {
          console.log("Token renewal error:", error);
          return { ...token, isExpired: true };
        }
      }

      return token;
    },
    async session({ session, token }): Promise<any> {
      const userToken = token as unknown as JwtType;

      if (userToken.isExpired) {
        session.expires = "0";
        return session;
      }

      if (userToken.sessionid && userToken.id !== undefined) {
        return {
          ...session,
          sessionid: userToken.sessionid,
          userId: userToken.id,
          role: userToken.role,
          cexp: userToken.cexp,
          user: {
            ...session.user,
            id: userToken.id,
            role: userToken.role,
          },
        };
      }

      return session;
    },
  },
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
