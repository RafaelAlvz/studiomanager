"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentActions from '@/components/dashboard/AppointmentActions';

interface Profissional {
  id: string;
  nome: string;
  especialidade: string | null;
}

interface Agendamento {
  id: string;
  profissional_id: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  status_agendamento: string;
  observacao?: string | null;
  cliente: { nome: string; telefone_whatsapp: string };
  servico: { nome_servico: string; duracao: number };
}

interface AgendaManagerProps {
  profissionais: Profissional[];
  initialAgendamentos: Agendamento[];
}

export default function AgendaManager({ profissionais, initialAgendamentos }: AgendaManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>(
    profissionais.length > 0 ? profissionais[0].id : ""
  );

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedAppointment, setSelectedAppointment] = useState<Agendamento | null>(null);

  // Date Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentMonthView, setCurrentMonthView] = useState(new Date());

  // Filter appointments for the selected day and professional
  const filteredAgendamentos = initialAgendamentos.filter((a) => {
    // Ensure we are comparing dates correctly (removing time part)
    const isSameProfissional = (a as any).profissional_id === selectedProfissionalId;
    const isSameDate = isSameDay(new Date(a.data_hora_inicio), selectedDate);
    const isNotCanceled = a.status_agendamento !== 'Cancelado';
    return isSameProfissional && isSameDate && isNotCanceled;
  }).sort((a, b) => new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime());

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    setCurrentMonthView(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    setCurrentMonthView(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonthView(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonthView(date);
    setIsDatePickerOpen(false);
  };

  const nextMonth = () => setCurrentMonthView(addMonths(currentMonthView, 1));
  const prevMonth = () => setCurrentMonthView(subMonths(currentMonthView, 1));

  // Calendar logic
  const monthStart = startOfMonth(currentMonthView);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Confirmado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // Pendente
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-3 w-full md:w-auto relative">
          <button onClick={handlePrevDay} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex flex-col items-center flex-1 md:flex-none min-w-[200px] hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer group"
            >
              <span className="text-sm font-medium text-emerald-600 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">
                {format(selectedDate, 'EEEE', { locale: ptBR })}
              </span>
              <span className="text-xl font-bold text-slate-800 flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                <CalendarIcon size={18} className={isDatePickerOpen ? "text-emerald-500" : "text-slate-400 group-hover:text-emerald-500 transition-colors"} />
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </button>

            {isDatePickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[300px] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"><ChevronLeft size={16} className="text-slate-600" /></button>
                    <span className="font-bold text-slate-800 capitalize text-lg">{format(currentMonthView, 'MMMM yyyy', { locale: ptBR })}</span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"><ChevronRight size={16} className="text-slate-600" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    {weekDays.map(day => <div key={day}>{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentMonthView);
                      const isDayToday = isToday(day);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectDate(day)}
                          className={`
                            h-10 w-full text-sm rounded-xl flex items-center justify-center transition-all font-medium
                            ${!isCurrentMonth ? 'text-slate-300 hover:text-slate-400' : 'text-slate-700 hover:bg-slate-50'}
                            ${isSelected ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200' : ''}
                            ${!isSelected && isDayToday ? 'border-2 border-emerald-500 text-emerald-600 font-bold' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={handleNextDay} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
            <ChevronRight size={20} className="text-slate-600" />
          </button>

          <button onClick={handleToday} className="ml-2 text-sm font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors hidden lg:block shrink-0">
            Hoje
          </button>
        </div>

        {/* Professional Filter */}
        <div className="w-full md:w-auto flex flex-col md:flex-row items-center justify-center md:justify-end gap-3 z-30">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'daily' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Diário
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'weekly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semanal
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 shrink-0 mt-2 md:mt-0">
            <User size={16} />
            Profissional:
          </div>
          <select
            className="flex-1 max-w-[200px] md:w-64 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-all cursor-pointer"
            value={selectedProfissionalId}
            onChange={(e) => setSelectedProfissionalId(e.target.value)}
          >
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agenda Timeline View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">
            {viewMode === 'daily' ? 'Horários Agendados' : 'Visão Semanal da Agenda'}
          </h3>
          {viewMode === 'daily' && (
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm shrink-0 ml-2">
              {filteredAgendamentos.length} atendimentos
            </span>
          )}
        </div>

        <div className="p-0">
          {viewMode === 'weekly' ? (
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:grid md:grid-cols-7 gap-4">
                {eachDayOfInterval({
                  start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
                  end: endOfWeek(selectedDate, { weekStartsOn: 0 })
                }).map((day) => {
                  const dayAgendamentos = initialAgendamentos.filter((a) => {
                    const isSameProfissional = (a as any).profissional_id === selectedProfissionalId;
                    const isSameDate = isSameDay(new Date(a.data_hora_inicio), day);
                    const isNotCanceled = a.status_agendamento !== 'Cancelado';
                    return isSameProfissional && isSameDate && isNotCanceled;
                  }).sort((a, b) => new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime());

                  const isDayToday = isToday(day);

                  return (
                    <div key={day.toISOString()} className={`flex flex-col rounded-2xl border ${isDayToday ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className={`p-3 border-b text-center rounded-t-2xl flex flex-col items-center py-4 ${isDayToday ? 'border-emerald-200 bg-emerald-100/50' : 'border-slate-200 bg-white'}`}>
                        <div className={`text-base font-bold capitalize ${isDayToday ? 'text-emerald-800' : 'text-slate-800'}`}>
                          {format(day, 'EEEE', { locale: ptBR })}
                        </div>
                        <div className={`text-sm mt-0.5 ${isDayToday ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold'}`}>
                          {format(day, 'dd/MM')}
                        </div>
                      </div>

                      <div className="p-2 md:p-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] min-h-[150px]">
                        {dayAgendamentos.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl m-2 bg-slate-50/30">
                            Agenda Livre
                          </div>
                        ) : (
                          dayAgendamentos.map(agen => {
                            const isPast = new Date(agen.data_hora_fim) < new Date();
                            const isConcluido = agen.status_agendamento === 'Concluído';

                            const bgSolidClass =
                              agen.status_agendamento === 'Concluído' ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200' :
                                agen.status_agendamento === 'Confirmado' ? 'bg-blue-100 hover:bg-blue-200 border-blue-200' :
                                  agen.status_agendamento === 'Cancelado' ? 'bg-red-100 hover:bg-red-200 border-red-200' :
                                    'bg-amber-100 hover:bg-amber-200 border-amber-200';

                            const dotClass =
                              agen.status_agendamento === 'Concluído' ? 'bg-emerald-500' :
                                agen.status_agendamento === 'Confirmado' ? 'bg-blue-500' :
                                  agen.status_agendamento === 'Cancelado' ? 'bg-red-500' :
                                    'bg-amber-500';

                            return (
                              <div
                                key={agen.id}
                                onClick={() => setSelectedAppointment(agen)}
                                className={`p-2 rounded-lg border shadow-sm flex flex-col gap-1 relative transition-all cursor-pointer overflow-hidden ${isPast || isConcluido ? 'opacity-70' : ''} ${bgSolidClass}`}
                              >
                                <div className="flex items-center gap-1.5 opacity-80">
                                  <div className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />
                                  <span className="text-[10px] md:text-xs font-bold text-slate-700">
                                    {format(new Date(agen.data_hora_inicio), 'HH:mm')}
                                  </span>
                                </div>
                                <h4 className="text-[11px] md:text-xs font-bold text-slate-800 line-clamp-1 truncate leading-tight" title={agen.cliente.nome}>{agen.cliente.nome}</h4>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {filteredAgendamentos.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum agendamento para este dia.</p>
                  <p className="text-sm text-slate-400 mt-1">A agenda deste profissional está livre.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAgendamentos.map((agendamento) => {
                    const startTime = format(new Date(agendamento.data_hora_inicio), 'HH:mm');
                    const endTime = format(new Date(agendamento.data_hora_fim), 'HH:mm');
                    const isPast = new Date(agendamento.data_hora_fim) < new Date();
                    const isConcluido = agendamento.status_agendamento === 'Concluído';

                    return (
                      <div key={agendamento.id} className={`p-4 md:p-6 flex flex-col md:flex-row gap-4 hover:bg-slate-50 transition-colors ${isPast || isConcluido ? 'opacity-60' : ''} ${isConcluido ? 'bg-emerald-50/50' : ''}`}>

                        {/* Time Block */}
                        <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 w-32 shrink-0">
                          <div className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                            <Clock size={16} className={isPast ? "text-slate-400" : "text-emerald-500"} />
                            {startTime}
                          </div>
                          <div className="text-sm font-medium text-slate-400 md:ml-6 md:mt-1">até {endTime}</div>
                        </div>

                        {/* Content Block */}
                        <div className="flex-1 border-l-2 md:border-l-4 border-slate-200 pl-4 md:pl-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <h4 className="text-base font-bold text-slate-800">{agendamento.cliente.nome}</h4>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(agendamento.status_agendamento)} w-fit`}>
                              {agendamento.status_agendamento}
                            </span>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                              <p className="text-sm text-slate-600 font-medium">
                                {agendamento.servico.nome_servico} <span className="text-slate-400 font-normal">({agendamento.servico.duracao} min)</span>
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                Contato: {agendamento.cliente.telefone_whatsapp}
                              </p>
                            </div>
                            <AppointmentActions
                              agendamentoId={agendamento.id}
                              statusAgendamento={agendamento.status_agendamento}
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal (Pop-up Padrão Ouro) */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-emerald-600" size={24} />
                Detalhes do Agendamento
              </h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              {/* Client Info */}
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Cliente</p>
                <div className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                    {selectedAppointment.cliente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800 leading-tight">{selectedAppointment.cliente.nome}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{selectedAppointment.cliente.telefone_whatsapp}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} /> Data e Hora
                  </p>
                  <p className="text-base font-bold text-slate-800">
                    {format(new Date(selectedAppointment.data_hora_inicio), "dd/MM/yyyy")}
                  </p>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    {format(new Date(selectedAppointment.data_hora_inicio), 'HH:mm')} às {format(new Date(selectedAppointment.data_hora_fim), 'HH:mm')}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Serviço
                  </p>
                  <p className="text-base font-bold text-slate-800 line-clamp-1" title={selectedAppointment.servico.nome_servico}>
                    {selectedAppointment.servico.nome_servico}
                  </p>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    {selectedAppointment.servico.duracao} min
                  </p>
                </div>
              </div>

              {/* Observações Elegantes */}
              {selectedAppointment.observacao && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                    Observações
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedAppointment.observacao}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(selectedAppointment.status_agendamento)} shadow-sm`}>
                {selectedAppointment.status_agendamento}
              </span>
              <div className="w-full sm:w-auto flex justify-end">
                <AppointmentActions
                  agendamentoId={selectedAppointment.id}
                  statusAgendamento={selectedAppointment.status_agendamento}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
