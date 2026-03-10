import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telefone = searchParams.get('telefone');

  if (!telefone) {
    return NextResponse.json({ error: 'Telefone não fornecido.' }, { status: 400 });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_whatsapp: telefone },
      select: {
        id: true,
        nome: true,
        telefone_whatsapp: true,
        total_faltas: true
      }
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro na busca de cliente:", error);
    return NextResponse.json({ error: 'Erro interno ao buscar cliente.' }, { status: 500 });
  }
}
