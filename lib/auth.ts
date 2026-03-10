import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "E-mail", type: "email" },
                senha: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.senha) {
                    throw new Error("Preencha e-mail e senha.");
                }

                // Buscar usuário
                const user = await prisma.usuario.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.senha) {
                    throw new Error("Usuário ou senha inválidos.");
                }

                // Verificar senha
                const isValidPassword = await bcrypt.compare(credentials.senha, user.senha);

                if (!isValidPassword) {
                    throw new Error("Usuário ou senha inválidos.");
                }

                // Retornar objeto seguro para o JWT
                return {
                    id: user.id,
                    name: user.nome,
                    email: user.email,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // user só está disponível na hora do login inicial
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login', // Redireciona usuários deslogados pra cá
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-do-not-use-in-production",
};
