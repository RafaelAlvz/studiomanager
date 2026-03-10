"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateAppointmentStatusAction(id: string, newStatus: string) {
    try {
        const updateData: any = {
            status_agendamento: newStatus,
        };

        if (newStatus === 'Concluído') {
            updateData.status_pagamento = 'Pago_Total';
        } else if (newStatus === 'Cancelado') {
            updateData.status_pagamento = 'Cancelado';
        }

        const agendamento = await prisma.agendamento.update({
            where: { id },
            data: updateData,
            include: {
                cliente: true,
                servico: true
            }
        });

        if (newStatus === 'Concluído') {
            const txExists = await prisma.transacao.findFirst({
                where: { agendamentoId: agendamento.id, tipo: 'ENTRADA' }
            });

            if (!txExists) {
                await prisma.transacao.create({
                    data: {
                        agendamentoId: agendamento.id,
                        tipo: 'ENTRADA',
                        valor: agendamento.valor_total,
                        descricao: `Pagamento - ${agendamento.servico.nome_servico} - ${agendamento.cliente.nome}`,
                    }
                });
            }
        }

        // Atualiza a interface em tempo real invalidando dados cacheados das rotas de Agenda e Dashboard
        revalidatePath('/');
        revalidatePath('/agenda');

        return { success: true };
    } catch (error) {
        console.error("Failed to update appointment", error);
        throw new Error("Não foi possível atualizar o agendamento.");
    }
}
