import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_APP_CLIENT_ID,
      clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
      tenantId: process.env.AZURE_APP_TENANT_ID,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.info(`SIGN IN - PROFILE ${profile.name}`);
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.info(`REDIRECT - URL ${url} - BASEURL ${baseUrl}`);
      return baseUrl;
    },
    async session({ session, user, token }) {
      console.info("SESSION");
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.info("JWT");
      return token;
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
