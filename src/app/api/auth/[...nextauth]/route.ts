import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  pages: {
    signIn: "../../../account/page.tsx",
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
      name: "Credentials" ,
      credentials: {
        email: {label: "Email" , type:"text" , placeholder:"Email"},
        password: {label:"Password" , type:"password" , placeholder:"Password"}
      },
      async authorize(credentails , req) {
        console.log("Credential: " , credentails)
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        console.log("token", token);
        console.warn("profile", profile);
      }

      return token;
    },
  },
});
export { handler as GET, handler as POST };
