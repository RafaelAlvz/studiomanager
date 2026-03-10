import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal';
import NewExpenseModal from '@/components/dashboard/NewExpenseModal';
import AppointmentActions from '@/components/dashboard/AppointmentActions';
import {
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Menu,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function AdminDashboard() {
  const agora = new Date();
  const inicioDia = startOfDay(agora);
  const fimDia = endOfDay(agora);
  const inicioMes = startOfMonth(agora);
  const fimMes = endOfMonth(agora);

  // Período de 7 dias para o gráfico
  const inicioSeteDias = startOfDay(subDays(agora, 6)); // Hoje + 6 dias pra trás (total 7)
  const fimSeteDias = endOfDay(agora);

  // Buscar os dados necessários do banco em paralelo
  const [
    agendamentos,
    clientesRaw,
    profissionaisRaw,
    servicosRaw,
    entradasFluxo,
    saidasFluxo,
    transacoesSeteDiasRaw
  ] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        data_hora_inicio: {
          gte: inicioDia,
          lte: fimDia
        }
      },
      include: {
        cliente: true,
        servico: true,
        profissional: true
      },
      orderBy: {
        data_hora_inicio: 'asc'
      }
    }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
    prisma.profissional.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
    prisma.servico.findMany({ select: { id: true, nome_servico: true, duracao: true, tempoPreparacao: true }, orderBy: { nome_servico: 'asc' } }),
    prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        tipo: 'ENTRADA' as any,
        data: { gte: inicioMes, lte: fimMes }
      }
    }),
    prisma.transacao.aggregate({
      _sum: { valor: true },
      where: {
        tipo: 'SAIDA' as any,
        data: { gte: inicioMes, lte: fimMes }
      }
    }),
    prisma.transacao.findMany({
      where: {
        tipo: 'ENTRADA',
        data: { gte: inicioSeteDias, lte: fimSeteDias }
      },
      select: { data: true, valor: true }
    })
  ]);

  // Formatar dados para options do select
  const clientes = clientesRaw.map((c: any) => ({ id: c.id, name: c.nome }));
  const profissionais = profissionaisRaw.map((p: any) => ({ id: p.id, name: p.nome }));
  const servicos = servicosRaw.map((s: any) => {
    const extra = (s.tempoPreparacao && s.tempoPreparacao > 0) ? ` + ${s.tempoPreparacao}min prep` : '';
    return { id: s.id, name: `${s.nome_servico} - ${s.duracao}min${extra}` };
  });

  // Calcular Financeiro (Resgatando de _sum e protegendo contra null)
  const totalEntradas = Number(entradasFluxo._sum?.valor || 0);
  const totalSaidas = Number(saidasFluxo._sum?.valor || 0);
  const resultadoPeriodo = totalEntradas - totalSaidas;

  // Processar dados do Gráfico
  const chartData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const diaReferencia = subDays(agora, i);
    const labelDia = format(diaReferencia, 'EEE', { locale: ptBR }); // Ex: dom, seg, ter

    // Somar transações que caíram neste dia específico
    const totalDia = transacoesSeteDiasRaw
      .filter((t: any) => isSameDay(new Date(t.data), diaReferencia))
      .reduce((acc: number, curr: any) => acc + curr.valor, 0);

    chartData.push({
      name: labelDia.charAt(0).toUpperCase() + labelDia.slice(1),
      valor: totalDia
    });
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
        <header className="mb-8 mt-2 md:mt-0">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Visão Geral</h2>
          <p className="text-slate-500 mt-1">Acompanhe seus agendamentos e faturamento de hoje.</p>
        </header>

        {/* Financial Metrics (Tremor style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Card 1: Receitas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Entradas (Mês)</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalEntradas)}</h3>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 h-6">
                +14%
              </span>
              <span className="text-xs text-slate-500 ml-2">vs. mês anterior</span>
            </div>
          </div>

          {/* Card 2: Despesas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Saídas (Mês)</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalSaidas)}</h3>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown size={20} className="text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 h-6">
                +2%
              </span>
              <span className="text-xs text-slate-500 ml-2">vs. mês anterior</span>
            </div>
          </div>

          {/* Card 3: Lucro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Resultado do Período</p>
                <h3 className={`text-2xl font-bold mt-1 ${resultadoPeriodo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(resultadoPeriodo)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                <CreditCard size={20} className="text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 h-6">
                +18%
              </span>
              <span className="text-xs text-slate-500 ml-2">vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Chart de Faturamento (BarChart) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Faturamento Diário</h3>
              <p className="text-sm text-slate-500">Fluxo de caixa de Entradas dos últimos 7 dias</p>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
          </div>
          <DashboardChart data={chartData} />
        </div>

        {/* Agenda do Dia (Dinâmica do Banco) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Agenda de Hoje</h3>
              <p className="text-sm text-slate-500">{agendamentos.length} agendamentos encontrados</p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
              <Link href="/agenda" className="text-sm text-center font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors hidden md:block">
                Ver todos
              </Link>
              <div className="w-full md:w-auto [&>button]:w-full">
                <NewExpenseModal />
              </div>
              <div className="w-full md:w-auto [&>button]:w-full">
                <NewAppointmentModal
                  clientes={clientes}
                  profissionais={profissionais}
                  servicos={servicos}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {agendamentos.filter((a: any) => a.status_agendamento !== 'Cancelado').length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhum agendamento ativo para hoje.</div>
            ) : (
              agendamentos.filter((a: any) => a.status_agendamento !== 'Cancelado').map((agendamento: any) => {
                const hour = agendamento.data_hora_inicio.getHours().toString().padStart(2, '0');
                const minute = agendamento.data_hora_inicio.getMinutes().toString().padStart(2, '0');
                const timeStr = `${hour}:${minute}`;

                // Formatar duração da diferença das datas
                const diffMs = agendamento.data_hora_fim.getTime() - agendamento.data_hora_inicio.getTime();
                const diffMins = Math.round(diffMs / 60000);
                const durationStr = diffMins >= 60
                  ? `${Math.floor(diffMins / 60)}h ${diffMins % 60 > 0 ? diffMins % 60 + 'm' : ''}`
                  : `${diffMins}m`;

                // Formatação local moeda
                const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(agendamento.valor_total));

                const isConcluido = agendamento.status_agendamento === 'Concluído' || agendamento.status_pagamento === 'Pago_Total';

                return (
                  <div key={agendamento.id} className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group ${isConcluido ? 'border-l-4 border-emerald-500 bg-emerald-50/50 opacity-60' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex flex-col items-center justify-center rounded-xl p-3 min-w-[70px] ${isConcluido ? 'bg-white shadow-sm border border-emerald-100' : 'bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-colors'}`}>
                        <span className="text-sm font-bold text-slate-800">{timeStr}</span>
                        <span className="text-xs text-slate-500 font-medium">{durationStr}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-base">{agendamento.cliente.nome}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {agendamento.servico.nome_servico}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Users size={14} /> com {agendamento.profissional.nome.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                      <div className="text-right hidden md:block mr-4">
                        <p className={`text-sm font-semibold ${isConcluido ? 'text-emerald-700' : 'text-slate-800'}`}>{valorFormatado}</p>
                        <p className={`text-xs font-medium ${isConcluido ? 'text-emerald-600' : agendamento.status_pagamento === 'Sinal_Pago' ? 'text-amber-600' : 'text-slate-500'}`}>
                          {agendamento.status_pagamento === 'Sinal_Pago' ? 'Sinal Pago' : agendamento.status_pagamento.replace('_', ' ')}
                        </p>
                      </div>
                      <AppointmentActions
                        agendamentoId={agendamento.id}
                        statusAgendamento={agendamento.status_agendamento}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
