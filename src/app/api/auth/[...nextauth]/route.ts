import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { authOptions } from "../../../../auth/authentication";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST};
