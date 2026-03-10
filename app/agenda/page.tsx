import React from 'react';
import prisma from '@/lib/prisma';
import { LayoutDashboard, Users, Menu, Scissors, CalendarDays, TrendingUp, Briefcase } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import AgendaManager from './AgendaManager';
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  // Fetch all professionals for the filter
  const profissionais = await prisma.profissional.findMany({
    orderBy: { nome: 'asc' }
  });

  // Fetch all appointments (In a real app, you might want to fetch only a range of dates to save memory, 
  // but for MVP we fetch all active ones, or the next 30 days)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30); // fetch from 30 days ago to future

  // Fetch options for the NewAppointmentModal
  const [clientesRaw, profissionaisRaw, servicosRaw, config] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
    prisma.profissional.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
    prisma.servico.findMany({ select: { id: true, nome_servico: true, duracao: true, tempoPreparacao: true }, orderBy: { nome_servico: 'asc' } }),
    getConfiguracaoAction()
  ]);

  const clientesOptions = clientesRaw.map((c: any) => ({ id: c.id, name: c.nome }));
  const profissionaisOptions = profissionaisRaw.map((p: any) => ({ id: p.id, name: p.nome }));
  const servicosOptions = servicosRaw.map((s: any) => {
    const extra = (s.tempoPreparacao && s.tempoPreparacao > 0) ? ` + ${s.tempoPreparacao}min prep` : '';
    return { id: s.id, name: `${s.nome_servico} - ${s.duracao}min${extra}` };
  });

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      data_hora_inicio: {
        gte: dataLimite // don't load extremely old ones in the main view
      }
    },
    include: {
      cliente: { select: { nome: true, telefone_whatsapp: true } },
      servico: { select: { nome_servico: true, duracao: true } },
    },
    orderBy: { data_hora_inicio: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
        <header className="mb-8 mt-2 md:mt-0 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              Visão da Agenda
            </h2>
            <p className="text-slate-500 mt-1">Acompanhe todos os horários e fluxos de cada profissional.</p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <NewAppointmentModal
              clientes={clientesOptions}
              profissionais={profissionaisOptions}
              servicos={servicosOptions}
            />
          </div>
        </header>

        <AgendaManager
          profissionais={profissionais}
          initialAgendamentos={agendamentos as any}
        />

      </main>
    </div>
  );
}
