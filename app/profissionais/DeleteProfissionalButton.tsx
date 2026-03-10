'use client';

import { Trash2 } from 'lucide-react';
import { deleteProfissionalAction } from '@/lib/actions/profissional-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function DeleteProfissionalButton({ id, nome }: { id: string, nome: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir o profissional ${nome}? O histórico de agendamentos não pode possuir vínculos a ele.`)) {
            startTransition(async () => {
                try {
                    await deleteProfissionalAction(id);
                    toast.success(`${nome} foi excluído do sistema.`);
                    router.refresh();
                } catch (error: any) {
                    toast.error(error.message || 'Erro ao tentar excluir profissional.');
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            title="Excluir Profissional"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
            <Trash2 size={18} />
        </button>
    );
}
