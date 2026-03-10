"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, CalendarClock, Search, UserPlus } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import '@/app/phone-input.css';

interface SelectOption {
  id: string;
  name: string;
}

interface NewAppointmentModalProps {
  clientes: SelectOption[];
  profissionais: SelectOption[];
  servicos: SelectOption[];
}

export default function NewAppointmentModal({ clientes, profissionais, servicos }: NewAppointmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [clienteId, setClienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  // Combobox & New Client State
  const [searchCliente, setSearchCliente] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.name.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCreatingClient && !clienteId) {
      setError("Por favor, selecione um cliente ou cadastre um novo.");
      return;
    }

    if (isCreatingClient && !searchCliente.trim()) {
      setError("O nome do novo cliente não pode estar vazio.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [year, month, day] = data.split('-').map(Number);
      const [hours, minutes] = hora.split(':').map(Number);
      // Criar a data no fuso local do navegador para evitar que o Node/Servidor leia como UTC cru
      const dataHoraLocal = new Date(year, month - 1, day, hours, minutes, 0);
      const dateTimeString = dataHoraLocal.toISOString();

      const payload: any = {
        profissional_id: profissionalId,
        servico_id: servicoId,
        data_hora_inicio: dateTimeString
      };

      if (isCreatingClient) {
        payload.novoCliente = {
          nome: searchCliente.trim(),
          telefone: newClientPhone.trim() || undefined
        };
      } else {
        payload.cliente_id = clienteId;
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro ao criar o agendamento.");
      }

      // Success!
      setIsOpen(false);
      resetForm();
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setClienteId("");
    setProfissionalId("");
    setServicoId("");
    setData("");
    setHora("");
    setSearchCliente("");
    setIsCreatingClient(false);
    setNewClientPhone("");
    setIsDropdownOpen(false);
    setError(null);
  }

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
  }

  const handleSelectClient = (c: SelectOption) => {
    setClienteId(c.id);
    setSearchCliente(c.name);
    setIsCreatingClient(false);
    setIsDropdownOpen(false);
  }

  const startCreatingClient = () => {
    setClienteId("");
    setIsCreatingClient(true);
    setIsDropdownOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
      >
        <Plus size={18} />
        Novo Agendamento
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Novo Agendamento</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Marque um horário para o cliente</p>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleSubmit} className="p-6">

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <span className="font-semibold px-1">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-5">
                {/* Cliente Combobox (mutuamente exclusivo com a criação de cliente) */}
                {!isCreatingClient && (
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cliente</label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome..."
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={searchCliente}
                        onChange={(e) => {
                          setSearchCliente(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                    </div>

                    {/* Dropdown de Clientes */}
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredClientes.length > 0 ? (
                          <ul className="py-1">
                            {filteredClientes.map((c) => (
                              <li
                                key={c.id}
                                onClick={() => handleSelectClient(c)}
                                className="px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-medium text-slate-700">{c.name}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">
                            Nenhum cliente encontrado com "{searchCliente}"
                          </div>
                        )}

                        {/* Opção de Criar Novo no final do dropdown */}
                        <div className="border-t border-slate-100 p-2">
                          <button
                            type="button"
                            onClick={startCreatingClient}
                            className="w-full flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <UserPlus size={16} />
                            + Cadastrar "{searchCliente || 'Novo Cliente'}"
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Campos Extras (Criação de Cliente Inline) */}
                {isCreatingClient && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200 relative">
                    <button
                      type="button"
                      onClick={() => setIsCreatingClient(false)}
                      className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100/50 rounded-lg transition-colors"
                      title="Voltar para a busca"
                    >
                      <X size={18} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-1">
                      <UserPlus size={16} />
                      Cadastrar Novo Cliente
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Nome do novo cliente"
                        className="w-full bg-white border border-emerald-200 text-slate-900 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm mb-3"
                        value={searchCliente}
                        onChange={e => setSearchCliente(e.target.value)}
                        autoFocus
                      />
                      <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp (Opcional)</label>
                      <PhoneInput
                        international
                        defaultCountry="BR"
                        limitMaxLength
                        value={newClientPhone}
                        onChange={(value) => setNewClientPhone(value || '')}
                        className={`w-full bg-white border ${newClientPhone && !isValidPhoneNumber(newClientPhone) ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500' : 'border-emerald-200 focus-within:ring-emerald-500/20 focus-within:border-emerald-500'} text-slate-900 rounded-lg px-3 py-2 outline-none focus-within:ring-2 transition-all text-sm`}
                      />
                      {newClientPhone && !isValidPhoneNumber(newClientPhone) && (
                        <p className="text-xs text-red-500 mt-1 font-medium">Número de telefone inválido.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Profissional e Serviço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Profissional</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={profissionalId}
                      onChange={e => setProfissionalId(e.target.value)}
                    >
                      <option value="" disabled>Selecione</option>
                      {profissionais.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Serviço</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={servicoId}
                      onChange={e => setServicoId(e.target.value)}
                    >
                      <option value="" disabled>Selecione</option>
                      {servicos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                      value={data}
                      onChange={e => setData(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Horário</label>
                    <input
                      type="time"
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                      value={hora}
                      onChange={e => setHora(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (isCreatingClient && !!newClientPhone && !isValidPhoneNumber(newClientPhone))}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Checando & Salvando...' : 'Agendar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
