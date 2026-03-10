import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal';
import NewExpenseModal from '@/components/dashboard/NewExpenseModal';
import DashboardAgenda from '@/components/dashboard/DashboardAgenda';
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
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function AdminDashboard() {
  const agora = new Date();
  const inicioFiltroAgenda = startOfDay(agora); // Começa hoje cedo (Local do Server)
  const fimFiltroAgenda = endOfDay(addDays(agora, 7)); // Vai até o fim do 7º dia
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
    transacoesSeteDiasRaw,
    config
  ] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        data_hora_inicio: {
          gte: inicioFiltroAgenda,
          lte: fimFiltroAgenda
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
    }),
    getConfiguracaoAction()
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
      <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />

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

        {/* Agenda Dinâmica (Hoje / Semana) */}
        <DashboardAgenda
          agendamentos={agendamentos}
          clientes={clientes}
          profissionais={profissionais}
          servicos={servicos}
        />
      </main>
    </div>
  );
}
