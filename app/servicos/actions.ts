'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createServico(data: { nome_servico: string, duracao: number, tempoPreparacao: number, preco: number }) {
  await prisma.servico.create({ data });
  revalidatePath('/servicos');
  revalidatePath('/'); // Refresh dashboard selects
}

export async function updateServico(id: string, data: { nome_servico: string, duracao: number, tempoPreparacao: number, preco: number }) {
  await prisma.servico.update({ where: { id }, data });
  revalidatePath('/servicos');
  revalidatePath('/');
}

export async function deleteServico(id: string) {
  // Check if there are appointments to prevent breaking history
  const agendamentos = await prisma.agendamento.count({ where: { servico_id: id } });
  if (agendamentos > 0) {
    // Soft delete / inactivate
    await prisma.servico.update({ where: { id }, data: { ativo: false } });
  } else {
    // Hard delete
    await prisma.servico.delete({ where: { id } });
  }
  revalidatePath('/servicos');
  revalidatePath('/');
}
