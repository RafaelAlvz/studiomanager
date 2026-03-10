'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createExpense(data: { descricao: string, valor: number, data_transacao: string }) {
  await prisma.transacao.create({
    data: {
      tipo: 'SAIDA',
      descricao: data.descricao,
      valor: data.valor,
      data: new Date(data.data_transacao)
    }
  });

  revalidatePath('/');
}
