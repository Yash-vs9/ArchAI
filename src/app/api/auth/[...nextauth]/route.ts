import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Guest",
            credentials: {},
            async authorize() {
                // Return a mock guest user for hackathon mode
                return { id: "guest-id", name: "Hackathon User", email: "guest@hack.com" };
            }
        })
    ],
    callbacks: {
        async session({ session, token }: any) {
            if (session?.user) {
                if (token.sub === "guest-id") {
                    session.user.id = "guest-id";
                }
            }
            return session;
        }
    },
    session: {
        strategy: "jwt" as const,
    },
    secret: process.env.NEXTAUTH_SECRET || "hackathon-secret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
