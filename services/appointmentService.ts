import prisma from '@/lib/prisma';
import { parse } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface CreateAppointmentDto {
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora_inicio: Date;
  observacao?: string | null;
}

export async function createAppointment(data: CreateAppointmentDto) {
  // 1. Fetch service to understand duration and price
  const servico = await prisma.servico.findUnique({
    where: { id: data.servico_id }
  });

  if (!servico) {
    throw new Error("Serviço não encontrado.");
  }

  // 1.5 Fetch Professional working hours
  const profissional = await prisma.profissional.findUnique({
    where: { id: data.profissional_id }
  });

  if (!profissional) {
    throw new Error("Profissional não encontrado.");
  }

  // Verificar dia da semana (0 = Domingo, 1 = Segunda, etc)
  const diaSemana = data.data_hora_inicio.getDay().toString();
  const diasTrabalho = profissional.diasTrabalho.split(',');

  if (!diasTrabalho.includes(diaSemana)) {
    throw new Error("O profissional não atende neste dia da semana.");
  }

  // Obter tempo de preparação e calcular horário de término final do agendamento
  const tempoExtra = servico.tempoPreparacao || 0;
  const data_hora_fim = new Date(data.data_hora_inicio);
  data_hora_fim.setMinutes(data_hora_fim.getMinutes() + servico.duracao + tempoExtra);

  // Converter a hora de chegada (UTC no servidor) para o Horário de Brasília
  const timeZone = 'America/Sao_Paulo';
  const dataInicioZoned = toZonedTime(data.data_hora_inicio, timeZone);
  const dataFimZoned = toZonedTime(data_hora_fim, timeZone);

  // Obter a hora e minuto equivalentes exatamente no relógio BRT daquele instante
  const startHourBRT = dataInicioZoned.getHours();
  const startMinuteBRT = dataInicioZoned.getMinutes();

  const endHourBRT = dataFimZoned.getHours();
  const endMinuteBRT = dataFimZoned.getMinutes();

  // Converter os horários de expediente (texto puro do banco) também para um número comprável linear
  const [horaInicioStr, minInicioStr] = profissional.inicioExpediente.split(':');
  const startLimitNum = Number(horaInicioStr) * 100 + Number(minInicioStr);

  const [horaFimStr, minFimStr] = profissional.fimExpediente.split(':');
  const endLimitNum = Number(horaFimStr) * 100 + Number(minFimStr);

  const startBRTNum = startHourBRT * 100 + startMinuteBRT;
  const endBRTNum = endHourBRT * 100 + endMinuteBRT;

  if (startBRTNum < startLimitNum || endBRTNum > endLimitNum) {
    throw new Error("O horário selecionado está fora do expediente do profissional.");
  }

  // Verificar horário no passado
  if (data.data_hora_inicio < new Date()) {
    throw new Error("Não é possível realizar agendamentos em horários que já passaram.");
  }

  // 2. Validate availability (Check for conflicts)
  const conflitos = await prisma.agendamento.findMany({
    where: {
      profissional_id: data.profissional_id,
      status_agendamento: { not: "Cancelado" },
      OR: [
        // Novo agendamento começa durante um existente
        {
          data_hora_inicio: { lte: data.data_hora_inicio },
          data_hora_fim: { gt: data.data_hora_inicio }
        },
        // Novo agendamento termina durante um existente
        {
          data_hora_inicio: { lt: data_hora_fim },
          data_hora_fim: { gte: data_hora_fim }
        },
        // Novo agendamento engloba totalmente um existente
        {
          data_hora_inicio: { gte: data.data_hora_inicio },
          data_hora_fim: { lte: data_hora_fim }
        }
      ]
    }
  });

  if (conflitos.length > 0) {
    throw new Error("O profissional já possui um agendamento neste horário.");
  }

  // 3. Create the appointment
  const agendamento = await prisma.agendamento.create({
    data: {
      cliente_id: data.cliente_id,
      profissional_id: data.profissional_id,
      servico_id: data.servico_id,
      data_hora_inicio: data.data_hora_inicio,
      data_hora_fim: data_hora_fim,
      valor_total: servico.preco,
      status_agendamento: "Pendente",
      status_pagamento: servico.exige_pagamento_previo ? "Pendente" : "Pendente",
      observacao: data.observacao
    },
    include: {
      cliente: true,
      profissional: true,
      servico: true
    }
  });

  return agendamento;
}
