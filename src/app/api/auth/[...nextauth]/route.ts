import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const authOptions: AuthOptions = {
  providers: [
    {
      id: 'azure-ad',
      name: 'Azure Active Directory',
      type: 'oauth',
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/authorize?response_mode=query`,
        params: {
          audience: process.env.AZURE_APP_CLIENT_ID,
          scope:
            'openid',
        },
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`,
      wellKnown: process.env.AZURE_APP_OPENID,
      profile(profile) {
        return {
          id: profile.sub,
          ...profile,
        };
      },
      options: {
        clientId: process.env.AZURE_APP_CLIENT_ID,
        clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.info(`SIGN IN`);
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.info(`REDIRECT`);
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
