import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseISO, addMinutes } from 'date-fns';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { clienteNome, clienteTelefone, profissionalId, servicoId, data, horario } = body;

        // 1. Validação de Payload
        if (!clienteNome || !clienteTelefone || !profissionalId || !servicoId || !data || !horario) {
            return NextResponse.json({ error: 'Faltam parâmetros obrigatórios no body (clienteNome, clienteTelefone, profissionalId, servicoId, data, horario).' }, { status: 400 });
        }

        // 2. Formatando Telefone (limpar caracteres visuais que o bot talvez envie)
        const cleanPhone = clienteTelefone.replace(/\D/g, '');

        // 3. Buscar ou Criar Cliente (Upsert)
        // Usamos logicamente o findFirst para busca do telefone único, e create fallback. O Prisma suporta Upsert, mas a chave telefone deve ser tratada.
        let cliente = await prisma.cliente.findUnique({
            where: { telefone_whatsapp: cleanPhone }
        });

        if (!cliente) {
            cliente = await prisma.cliente.create({
                data: {
                    nome: clienteNome,
                    telefone_whatsapp: cleanPhone
                }
            });
        }

        // 4. Extrair Duração do Serviço e Calcular o Range
        const servico = await prisma.servico.findUnique({
            where: { id: servicoId }
        });

        if (!servico) {
            return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 });
        }

        // data = "2026-03-09", horario = "14:30" => "2026-03-09T14:30:00.000Z" (necessita cuidado com timezones da req/bot, assume Local)
        // Combinando datetime:
        const startDateTimeString = `${data}T${horario.padStart(5, '0')}:00`;
        // Usando parse nativo em cima da string (considerando q o app local usa tempo ISO).
        // Evitando problemas usamos criação Date.
        const [year, month, day] = data.split('-').map(Number);
        const [hour, minute] = horario.split(':').map(Number);

        const dataHoraInicio = new Date(year, month - 1, day, hour, minute);

        // Calculo fim
        const duracaoTotal = servico.duracao + (servico.tempoPreparacao || 0);
        const dataHoraFim = addMinutes(dataHoraInicio, duracaoTotal);

        // 5. Inserir Agendamento no Banco
        const agendamento = await prisma.agendamento.create({
            data: {
                cliente_id: cliente.id,
                profissional_id: profissionalId,
                servico_id: servicoId,
                data_hora_inicio: dataHoraInicio,
                data_hora_fim: dataHoraFim,
                status_agendamento: 'Pendente',
                status_pagamento: 'Pendente',
                valor_total: servico.preco
            }
        });

        // 6. Retorno Seguro
        return NextResponse.json({
            mensagem: 'Agendamento criado com sucesso',
            id: agendamento.id,
            cliente: cliente.nome,
            inicio: dataHoraInicio,
            fim: dataHoraFim
        }, { status: 201 });

    } catch (error) {
        console.error("Erro ao marcar agendamento via API:", error);
        return NextResponse.json({ error: 'Erro interno ao processar agendamento.' }, { status: 500 });
    }
}
