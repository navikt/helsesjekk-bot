import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { HttpsProxyAgent } from "https-proxy-agent";

export const authOptions: AuthOptions = {

  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_APP_CLIENT_ID,
      clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
      tenantId: process.env.AZURE_APP_TENANT_ID,
      httpOptions: {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY),
      },
    }),
  ],
  debug: true,
};
export default NextAuth(authOptions);
