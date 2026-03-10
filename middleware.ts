import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        // Rotas protegidas exigirão sessão ativa para acesar
        "/",
        "/agenda",
        "/clientes",
        "/servicos",
        "/profissionais",
        "/financeiro",
        // Protege criar agendamento via POST sem autenticação (exemplo)
        "/api/appointments/:path*",
        // Exclui a API de slot pública que o WhatsApp/Bot usa (Não declare pra proteger)
    ],
};
