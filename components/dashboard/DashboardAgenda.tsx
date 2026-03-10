"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewExpenseModal from './NewExpenseModal';
import NewAppointmentModal from './NewAppointmentModal';
import AppointmentActions from './AppointmentActions';

interface DashboardAgendaProps {
    agendamentos: any[];
    clientes: any[];
    profissionais: any[];
    servicos: any[];
}

export default function DashboardAgenda({ agendamentos, clientes, profissionais, servicos }: DashboardAgendaProps) {
    const [viewMode, setViewMode] = useState<'hoje' | 'semana'>('hoje');

    // Filtrar apenas agendamentos de hoje, ignorando cancelados
    const todayAgendamentos = agendamentos.filter((a) => {
        return isSameDay(new Date(a.data_hora_inicio), new Date()) && a.status_agendamento !== 'Cancelado';
    });

    // Agrupar agendamentos da semana por dia? Não, o pedido diz: 
    // "Se estiver em 'semana', mostre a lista da semana (pode ser um design de lista empilhada mais simples ou um mini-grid, adequado para o espaço do Dashboard)."
    // Como é dashboard, vamos mostrar em lista separados por data, agendamentos a frente na semana

    const weekAgendamentos = agendamentos.filter((a) => a.status_agendamento !== 'Cancelado');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluído': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
            case 'Confirmado': return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'Cancelado': return 'text-red-700 bg-red-100 border-red-200';
            default: return 'text-amber-700 bg-amber-100 border-amber-200'; // Pendente
        }
    };

    const renderAgendaList = (list: any[], showDate: boolean = false) => {
        if (list.length === 0) {
            return <div className="p-8 text-center text-slate-500">Nenhum agendamento ativo.</div>;
        }

        return list.map((agendamento: any) => {
            const hour = new Date(agendamento.data_hora_inicio).getHours().toString().padStart(2, '0');
            const minute = new Date(agendamento.data_hora_inicio).getMinutes().toString().padStart(2, '0');
            const timeStr = `${hour}:${minute}`;
            const dateStr = format(new Date(agendamento.data_hora_inicio), 'dd/MM (EEE)', { locale: ptBR });

            // Formatar duração da diferença das datas
            const diffMs = new Date(agendamento.data_hora_fim).getTime() - new Date(agendamento.data_hora_inicio).getTime();
            const diffMins = Math.round(diffMs / 60000);
            const durationStr = diffMins >= 60
                ? `${Math.floor(diffMins / 60)}h ${diffMins % 60 > 0 ? diffMins % 60 + 'm' : ''}`
                : `${diffMins}m`;

            // Formatação local moeda
            const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(agendamento.valor_total));

            const isConcluido = agendamento.status_agendamento === 'Concluído' || agendamento.status_pagamento === 'Pago_Total';

            return (
                <div key={agendamento.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group ${isConcluido ? 'border-l-4 border-emerald-500 bg-emerald-50/50 opacity-60' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`flex flex-col items-center justify-center rounded-xl p-3 min-w-[70px] ${isConcluido ? 'bg-white shadow-sm border border-emerald-100' : 'bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-colors'}`}>
                            <span className="text-sm font-bold text-slate-800">{timeStr}</span>
                            <span className="text-xs text-slate-500 font-medium">{durationStr}</span>
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-semibold text-slate-800 text-base">{agendamento.cliente.nome}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {showDate && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-600">
                                        <CalendarIcon size={12} className="mr-1" />
                                        {dateStr}
                                    </span>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {agendamento.servico.nome_servico}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                                    {agendamento.status_agendamento}
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
            );
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <div className="flex flex-col justify-start">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">Sua Agenda</h3>
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {viewMode === 'hoje' ? todayAgendamentos.length : weekAgendamentos.length} atendimentos
                        </span>
                    </div>

                    <div className="flex bg-white border border-slate-200 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setViewMode('hoje')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'hoje' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setViewMode('semana')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'semana' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Essa Semana
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                    <Link href="/agenda" className="text-sm text-center font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white px-4 py-2 rounded-xl transition-colors hidden md:block shadow-sm">
                        Ver Grid Completo
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
                {viewMode === 'hoje' ? renderAgendaList(todayAgendamentos, false) : renderAgendaList(weekAgendamentos, true)}
            </div>
        </div>
    );
}
