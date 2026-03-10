"use client";

import React, { useState } from 'react';
import { updateAppointmentStatusAction } from '@/lib/actions/appointment-actions';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentActionsProps {
    agendamentoId: string;
    statusAgendamento: string;
    variant?: 'default' | 'compact';
}

export default function AppointmentActions({ agendamentoId, statusAgendamento, variant = 'default' }: AppointmentActionsProps) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    if (statusAgendamento === 'Concluído' || statusAgendamento === 'Cancelado') {
        return null; // Regra de UX: Oculta a área de botões de ação caso o evento já esteja resolvido
    }

    const handleUpdate = async (status: string) => {
        setLoadingAction(status);
        try {
            await updateAppointmentStatusAction(agendamentoId, status);
            if (status === 'Concluído') {
                toast.success("Pagamento Confirmado!");
            } else if (status === 'Cancelado') {
                toast.error("Agendamento Cancelado");
            }
        } catch (e) {
            toast.error("Erro ao atualizar o agendamento.");
        } finally {
            setLoadingAction(null);
        }
    };

    const isCompact = variant === 'compact';

    return (
        <div className={isCompact ? "flex flex-col gap-1.5 w-full mt-2" : "flex items-center gap-2 mt-3 md:mt-0 w-full md:w-auto"}>
            <button
                onClick={() => handleUpdate('Concluído')}
                disabled={loadingAction !== null}
                className={`flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white font-medium ${isCompact ? 'w-full px-2 py-1.5 text-xs rounded-lg gap-1.5' : 'flex-1 md:flex-none px-4 py-2 rounded-xl text-sm gap-1.5 min-w-[190px]'
                    }`}
            >
                {loadingAction === 'Concluído' ? <><Loader2 size={14} className="animate-spin" /> {isCompact ? '...' : 'Processando...'}</> : <><CheckCircle2 size={14} /> {isCompact ? 'Concluir' : 'Confirmar Pagamento'}</>}
            </button>

            <button
                onClick={() => handleUpdate('Cancelado')}
                disabled={loadingAction !== null}
                className={`flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium ${isCompact ? 'w-full px-2 py-1.5 text-xs rounded-lg gap-1.5' : 'flex-1 md:flex-none px-4 py-2 rounded-xl text-sm gap-1.5 min-w-[120px]'
                    }`}
            >
                {loadingAction === 'Cancelado' ? <><Loader2 size={14} className="animate-spin" /> {isCompact ? '...' : 'Carregando'}</> : <><XCircle size={14} /> Cancelar</>}
            </button>
        </div>
    );
}
