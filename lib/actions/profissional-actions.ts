'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfissionalAction(data: {
  id: string;
  diasTrabalho: string;
  inicioExpediente: string;
  fimExpediente: string;
}) {
  try {
    await prisma.profissional.update({
      where: { id: data.id },
      data: {
        diasTrabalho: data.diasTrabalho,
        inicioExpediente: data.inicioExpediente,
        fimExpediente: data.fimExpediente,
      }
    });

    revalidatePath('/profissionais');
    revalidatePath('/agenda'); // Agendas now depend on limit recalculations

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar profissional:", error);
    throw new Error(error.message || "Falha ao salvar o expediente.");
  }
}

export async function createProfissionalAction(data: {
  nome: string;
  telefone?: string;
  email?: string;
}) {
  try {
    const profissional = await prisma.profissional.create({
      data: {
        nome: data.nome,
        telefone: data.telefone || null,
        email: data.email || null,
        diasTrabalho: '1,2,3,4,5',
        inicioExpediente: '08:00',
        fimExpediente: '18:00',
      }
    });

    revalidatePath('/profissionais');
    return { success: true, profissional };
  } catch (error: any) {
    console.error("Erro ao criar profissional:", error);
    throw new Error(error.message || "Falha ao criar profissional.");
  }
}

export async function updateProfissionalBaseAction(data: {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  especialidade?: string;
}) {
  try {
    await prisma.profissional.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        telefone: data.telefone || null,
        email: data.email || null,
        especialidade: data.especialidade || null,
      }
    });

    revalidatePath('/profissionais');
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar dados básicos do profissional:", error);
    throw new Error(error.message || "Falha ao atualizar cadastro.");
  }
}

export async function deleteProfissionalAction(id: string) {
  try {
    // Verifica se possui agendamentos atrelados (pode bloquear a exclusão dependendo da regra de DB)
    const count = await prisma.agendamento.count({ where: { profissional_id: id } });
    if (count > 0) {
      throw new Error("Não é possível excluir um profissional que possui agendamentos registrados no histórico.");
    }

    await prisma.profissional.delete({
      where: { id }
    });

    revalidatePath('/profissionais');
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir profissional:", error);
    throw new Error(error.message || "Falha ao excluir profissional.");
  }
}
