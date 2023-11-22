import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const authOptions: AuthOptions = {
  providers: [
    
    AzureADProvider({
      clientId: process.env.AZURE_APP_CLIENT_ID,
      clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
      tenantId: process.env.AZURE_APP_TENANT_ID,
      async profile(profile, tokens) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.info(`SIGN IN`);
      return true;
    },
    async session({ session, user, token }) {
      console.info("SESSION");
      console.info(token.accessToken);
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.info("JWT");
      console.info(account);
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
