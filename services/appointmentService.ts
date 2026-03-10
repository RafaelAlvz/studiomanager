import prisma from '@/lib/prisma';
import { parse } from 'date-fns';

interface CreateAppointmentDto {
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora_inicio: Date;
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

  // Verificar se os horários estão dentro do expediente
  const dataInicioExpediente = new Date(data.data_hora_inicio);
  const [horaInicioStr, minInicioStr] = profissional.inicioExpediente.split(':');
  dataInicioExpediente.setHours(Number(horaInicioStr), Number(minInicioStr), 0, 0);

  const dataFimExpediente = new Date(data.data_hora_inicio);
  const [horaFimStr, minFimStr] = profissional.fimExpediente.split(':');
  dataFimExpediente.setHours(Number(horaFimStr), Number(minFimStr), 0, 0);

  if (data.data_hora_inicio < dataInicioExpediente || data_hora_fim > dataFimExpediente) {
    throw new Error("O horário selecionado está fora do expediente do profissional.");
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
      status_pagamento: servico.exige_pagamento_previo ? "Pendente" : "Pendente"
    },
    include: {
      cliente: true,
      profissional: true,
      servico: true
    }
  });

  return agendamento;
}
