import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
export const authOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_APP_CLIENT_ID,
            clientSecret: process.env.AZURE_APP_CLIENT_SECRET,
            tenantId: process.env.AZURE_APP_TENANT_ID,
        }),
    ],
}
export default NextAuth(authOptions)
