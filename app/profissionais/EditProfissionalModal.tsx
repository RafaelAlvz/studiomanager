'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Save, CalendarDays, Clock } from 'lucide-react';
import { updateProfissionalAction } from '@/lib/actions/profissional-actions';

interface ProfissionalData {
  id: string;
  nome: string;
  especialidade: string | null;
  diasTrabalho: string;
  inicioExpediente: string;
  fimExpediente: string;
}

const DIAS_SEMANA = [
  { val: '0', label: 'Domingo' },
  { val: '1', label: 'Segunda-feira' },
  { val: '2', label: 'Terça-feira' },
  { val: '3', label: 'Quarta-feira' },
  { val: '4', label: 'Quinta-feira' },
  { val: '5', label: 'Sexta-feira' },
  { val: '6', label: 'Sábado' },
];

export default function EditProfissionalModal({ profissional }: { profissional: ProfissionalData }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // States
  const [diasTrabalho, setDiasTrabalho] = useState<string[]>(profissional.diasTrabalho.split(','));
  const [inicioExpediente, setInicioExpediente] = useState(profissional.inicioExpediente);
  const [fimExpediente, setFimExpediente] = useState(profissional.fimExpediente);

  const handleToggleDia = (val: string) => {
    setDiasTrabalho(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val].sort()
    );
  };

  const handleSave = async () => {
    if (diasTrabalho.length === 0) {
      setErrorMsg('Selecione pelo menos um dia de trabalho.');
      return;
    }

    // Validar hora (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(inicioExpediente) || !timeRegex.test(fimExpediente)) {
      setErrorMsg('Formato de hora inválido. Use HH:MM');
      return;
    }

    startTransition(async () => {
      try {
        await updateProfissionalAction({
          id: profissional.id,
          diasTrabalho: diasTrabalho.join(','),
          inicioExpediente,
          fimExpediente
        });

        setErrorMsg('');
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao salvar configurações.');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-100"
      >
        Configurar Expediente
      </button>

      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Configurar Regras de Agenda
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Profissional: <span className="font-semibold text-emerald-600">{profissional.nome}</span>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* Seletor de Dias */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <CalendarDays size={18} className="text-emerald-500" />
                  Dias de Trabalho
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {DIAS_SEMANA.map(dia => {
                    const ativo = diasTrabalho.includes(dia.val);
                    return (
                      <button
                        key={dia.val}
                        onClick={() => handleToggleDia(dia.val)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-all text-left flex items-center gap-2
                          ${ativo
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-medium shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                            ${ativo ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                          {ativo && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        {dia.label.split('-')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seletor de Horários */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Clock size={18} className="text-emerald-500" />
                  Horário de Expediente
                </label>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entrada (HH:mm)</label>
                    <input
                      type="time"
                      value={inicioExpediente}
                      onChange={(e) => setInicioExpediente(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-700"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Saída (HH:mm)</label>
                    <input
                      type="time"
                      value={fimExpediente}
                      onChange={(e) => setFimExpediente(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
        , document.body)}
    </>
  );
}
