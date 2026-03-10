"use client";

import React, { useState } from 'react';
import { updateAppointmentStatusAction } from '@/lib/actions/appointment-actions';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentActionsProps {
    agendamentoId: string;
    statusAgendamento: string;
}

export default function AppointmentActions({ agendamentoId, statusAgendamento }: AppointmentActionsProps) {
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

    return (
        <div className="flex items-center gap-2 mt-3 md:mt-0 w-full md:w-auto">
            <button
                onClick={() => handleUpdate('Concluído')}
                disabled={loadingAction !== null}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 min-w-[190px]"
            >
                {loadingAction === 'Concluído' ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : <><CheckCircle2 size={16} /> Confirmar Pagamento</>}
            </button>

            <button
                onClick={() => handleUpdate('Cancelado')}
                disabled={loadingAction !== null}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 min-w-[120px]"
            >
                {loadingAction === 'Cancelado' ? <><Loader2 size={16} className="animate-spin" /> Carregando</> : <><XCircle size={16} /> Cancelar</>}
            </button>
        </div>
    );
}
