'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCliente(data: { nome: string, telefone_whatsapp: string }) {
  // Validate if phone exists
  const exists = await prisma.cliente.findUnique({
    where: { telefone_whatsapp: data.telefone_whatsapp }
  });

  if (exists) {
    throw new Error('Já existe um cliente cadastrado com este telefone.');
  }

  await prisma.cliente.create({ data });
  revalidatePath('/clientes');
  revalidatePath('/'); // Refresh dashboard
}

export async function updateCliente(id: string, data: { nome: string, telefone_whatsapp: string }) {
  // Validate if phone exists for another client
  const exists = await prisma.cliente.findUnique({
    where: { telefone_whatsapp: data.telefone_whatsapp }
  });

  if (exists && exists.id !== id) {
    throw new Error('Já existe outro cliente cadastrado com este telefone.');
  }

  await prisma.cliente.update({ where: { id }, data });
  revalidatePath('/clientes');
  revalidatePath('/');
}

export async function deleteCliente(id: string) {
  // check for appointments
  const algumsAgendamentos = await prisma.agendamento.count({ where: { cliente_id: id } });
  
  if (algumsAgendamentos > 0) {
    throw new Error('Não é possível excluir um cliente com histórico de agendamentos. Delete os agendamentos primeiro ou inative o cliente.');
  }

  await prisma.cliente.delete({ where: { id } });
  revalidatePath('/clientes');
  revalidatePath('/');
}
