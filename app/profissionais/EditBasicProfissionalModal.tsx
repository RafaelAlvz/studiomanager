'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Pencil, Save } from 'lucide-react';
import { updateProfissionalBaseAction } from '@/lib/actions/profissional-actions';
import toast from 'react-hot-toast';

interface Props {
    profissional: {
        id: string;
        nome: string;
        telefone: string | null;
        email: string | null;
        especialidade: string | null;
    };
}

export default function EditBasicProfissionalModal({ profissional }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Form states
    const [nome, setNome] = useState(profissional.nome);
    const [telefone, setTelefone] = useState(profissional.telefone || '');
    const [email, setEmail] = useState(profissional.email || '');
    const [especialidade, setEspecialidade] = useState(profissional.especialidade || '');

    const handleUpdate = async () => {
        if (!nome.trim()) {
            toast.error('O nome do profissional é obrigatório.');
            return;
        }

        startTransition(async () => {
            try {
                await updateProfissionalBaseAction({
                    id: profissional.id,
                    nome,
                    telefone: telefone || undefined,
                    email: email || undefined,
                    especialidade: especialidade || undefined
                });

                toast.success('Cadastro atualizado com sucesso!');
                setIsOpen(false);
                router.refresh();
            } catch (err: any) {
                toast.error(err.message || 'Erro ao atualizar profissional.');
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Editar Cadastro"
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
                <Pencil size={18} />
            </button>

            {isOpen && mounted && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <Pencil size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Editar Cadastro
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Atualize os dados de {profissional.nome}.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome Completo *</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cargo / Especialidade</label>
                                <input
                                    type="text"
                                    value={especialidade}
                                    onChange={(e) => setEspecialidade(e.target.value)}
                                    placeholder="Ex: Barbeiro Sênior"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefone</label>
                                    <input
                                        type="tel"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="joao@email.com"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isPending}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Salvar Modificações
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
