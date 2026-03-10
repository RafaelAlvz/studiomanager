'use client';

import React, { useState, useTransition } from 'react';
import { Save, Image as ImageIcon, Briefcase, Palette, Info } from 'lucide-react';
import { saveConfiguracaoAction } from '@/lib/actions/configuracao-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesClient({ initialNome, initialLogo }: { initialNome: string, initialLogo: string | null }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [nomeNegocio, setNomeNegocio] = useState(initialNome);
    const [logoBase64, setLogoBase64] = useState<string | null>(initialLogo);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('O arquivo excedeu 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoBase64(reader.result as string);
                toast.success('Imagem lida com sucesso! Salve para persistir.');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomeNegocio.trim()) {
            toast.error('O nome do negócio não pode ser vazio.');
            return;
        }

        startTransition(async () => {
            try {
                await saveConfiguracaoAction({ nome_negocio: nomeNegocio, logo_url: logoBase64 });
                toast.success('Configurações salvas com sucesso!');
                router.refresh();
                window.dispatchEvent(new Event('configUpdated'));
            } catch (err: any) {
                toast.error(err.message || 'Falha ao salvar. Tente novamente.');
            }
        });
    };

    const handleRestore = async () => {
        startTransition(async () => {
            try {
                await saveConfiguracaoAction({ nome_negocio: 'StudioManager', logo_url: null });
                setNomeNegocio('StudioManager');
                setLogoBase64(null);
                toast.success('Padrões de fábrica restaurados!');
                router.refresh();
                window.dispatchEvent(new Event('configUpdated'));
            } catch (err: any) {
                toast.error('Falha ao restaurar padrões.');
            }
        });
    };

    return (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 space-y-8">

                {/* Secção Nome do Negócio */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                        <Briefcase size={20} className="text-emerald-500" />
                        Identidade da Empresa
                    </h3>

                    <div className="max-w-md">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome de Exibição (White-Label)</label>
                        <input
                            type="text"
                            value={nomeNegocio}
                            onChange={(e) => setNomeNegocio(e.target.value)}
                            placeholder="Ex: Barbearia Vip"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                        />
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Info size={14} /> Este nome aparecerá na Sidebar e nos relatórios.
                        </p>
                    </div>
                </section>

                {/* Secção Upload de Logo */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                        <ImageIcon size={20} className="text-emerald-500" />
                        Logomarca do Aplicativo
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className={`w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group relative ${logoBase64 ? 'bg-transparent border-none' : 'bg-slate-100'}`}>
                            {logoBase64 ? (
                                <img src={logoBase64} alt="Logomarca" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon size={32} className="text-slate-400" />
                            )}
                        </div>

                        <div className="flex-1">
                            <label className="bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-medium px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2">
                                Selecionar Imagem
                                <input type="file" accept="image/png, image/webp, image/jpeg" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <div className="mt-3 space-y-1 text-sm text-slate-500 bg-amber-50 rounded-xl border border-amber-100 p-4">
                                <p className="font-medium text-amber-800 mb-1">Requisitos Recomendados:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Imagem quadrada (Proporção 1:1), preferencialmente de <strong>256x256px</strong>.</li>
                                    <li>Formatos suportados: <strong>PNG transparente</strong> ou <strong>WEBP</strong>.</li>
                                    <li>Tamanho máximo do arquivo de <strong>2MB</strong>.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleRestore}
                    disabled={isPending}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                    Restaurar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Personalização
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
