import { NextResponse } from 'next/server';
import { createAppointment } from '@/services/appointmentService';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_id, profissional_id, servico_id, data_hora_inicio, novoCliente, observacao } = body;

    let finalClienteId = cliente_id;

    // Se o usuário optou por criar um novo cliente
    if (novoCliente && novoCliente.nome) {
      const newClient = await prisma.cliente.create({
        data: {
          nome: novoCliente.nome,
          telefone_whatsapp: novoCliente.telefone || `S/N-${Date.now()}` // Garantir unicidade caso o tel seja opcional
        }
      });
      finalClienteId = newClient.id;
    }

    // Basic Validation
    if (!finalClienteId || !profissional_id || !servico_id || !data_hora_inicio) {
      return NextResponse.json(
        { error: "Campos obrigatórios: cliente_id (ou novoCliente), profissional_id, servico_id, data_hora_inicio" },
        { status: 400 }
      );
    }

    // Call the Service
    const agendamento = await createAppointment({
      cliente_id: finalClienteId,
      profissional_id,
      servico_id,
      data_hora_inicio: new Date(data_hora_inicio),
      observacao
    });

    return NextResponse.json(agendamento, { status: 201 });

  } catch (error: any) {
    console.error("Erro interno ao criar agendamento:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If it's a known conflict error from our service, return 409 Conflict
    if (errorMessage.includes("já possui um agendamento")) {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    // Otherwise 400 Bad Request
    return NextResponse.json({ error: errorMessage || "Erro desconhecido ao agendar." }, { status: 400 });
  }
}
