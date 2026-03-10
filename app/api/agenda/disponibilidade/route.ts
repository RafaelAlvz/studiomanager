import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profissionalId = searchParams.get('profissionalId');
  const servicoId = searchParams.get('servicoId');
  const dataParam = searchParams.get('data'); // Formato: YYYY-MM-DD

  if (!profissionalId || !dataParam || !servicoId) {
    return NextResponse.json({ error: 'profissionalId, servicoId e data são obrigatórios.' }, { status: 400 });
  }

  try {
    const targetDate = parseISO(dataParam);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // 1. Validar Profissional e Service
    const profissional = await prisma.profissional.findUnique({
      where: { id: profissionalId }
    });
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    });

    if (!profissional || !servico) {
      return NextResponse.json({ error: 'Profissional ou Serviço não encontrado.' }, { status: 404 });
    }

    // 2. Verificar Trabalho Semanal (0 = Domingo, 1 = Segunda, etc.)
    const dayOfWeek = targetDate.getDay().toString();
    const diasTrabalho = profissional.diasTrabalho.split(',');

    if (!diasTrabalho.includes(dayOfWeek)) {
      return NextResponse.json({
        disponivel: false,
        mensagem: 'O profissional não atende neste dia da semana.',
        horariosLivres: []
      });
    }

    // Parse Working Hours (ex: "08:00")
    const [startHour, startMinute] = profissional.inicioExpediente.split(':').map(Number);
    const [endHour, endMinute] = profissional.fimExpediente.split(':').map(Number);

    const workStartTime = new Date(targetDate);
    workStartTime.setHours(startHour, startMinute, 0, 0);

    const workEndTime = new Date(targetDate);
    workEndTime.setHours(endHour, endMinute, 0, 0);

    // Duração Exigida = duração básica + tempo de preparação (em minutos)
    const requiredDuration = servico.duracao + (servico.tempoPreparacao || 0);

    // 3. Buscar agendamentos conflitantes no dia (ignorando Cancelados)
    const agendamentosOcupados = await prisma.agendamento.findMany({
      where: {
        profissional_id: profissionalId,
        data_hora_inicio: { gte: dayStart, lte: dayEnd },
        status_agendamento: { not: 'Cancelado' }
      },
      orderBy: { data_hora_inicio: 'asc' }
    });

    // 4. Motor de Cálculo de Horários
    const horariosLivres: string[] = [];
    let currentTime = new Date(workStartTime);
    const now = new Date(); // Regra do Tempo Real (Hoje)

    while (currentTime < workEndTime) {
      const blockEndTime = addMinutes(currentTime, requiredDuration);

      // Regra 1: O serviço não pode terminar depois do horário de expediente
      if (blockEndTime > workEndTime) {
        break; // Todos os próximos também estourarão o horário
      }

      // Regra 2: Regra de Tempo Real (Não pode agendar para um horário no passado no dia de hoje)
      if (isSameDayStrict(currentTime, now) && currentTime <= now) {
        currentTime = addMinutes(currentTime, 15); // Pula 15 mins e tenta o próximo
        continue;
      }

      // Regra 3: Conflito com Banco de Dados
      const isOccupied = agendamentosOcupados.some(ag => {
        const agInicio = new Date(ag.data_hora_inicio);
        const agFim = new Date(ag.data_hora_fim);

        // Há conflito se o bloco atual começar antes do fim do agendamento 
        // E terminar depois do início do agendamento (Overlap)
        return (currentTime < agFim) && (blockEndTime > agInicio);
      });

      if (!isOccupied) {
        const hh = currentTime.getHours().toString().padStart(2, '0');
        const mm = currentTime.getMinutes().toString().padStart(2, '0');
        horariosLivres.push(`${hh}:${mm}`);
      }

      // Desliza a janela em steps de 15 minutos para procurar novas opções de grid
      currentTime = addMinutes(currentTime, 15);
    }

    return NextResponse.json({
      disponivel: horariosLivres.length > 0,
      horariosLivres,
      expediente: `${profissional.inicioExpediente} - ${profissional.fimExpediente}`,
      tempoNecessarioMinutos: requiredDuration
    });

  } catch (error) {
    console.error("Erro na busca de disponibilidade:", error);
    return NextResponse.json({ error: 'Erro interno na validação de agenda.' }, { status: 500 });
  }
}

function isSameDayStrict(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
