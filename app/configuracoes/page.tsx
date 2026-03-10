import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { Palette } from 'lucide-react';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';
import ConfiguracoesClient from './ConfiguracoesClient';

export default async function ConfiguracoesPage() {
    const config = await getConfiguracaoAction();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />

            <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-4xl mx-auto">
                <header className="mb-8 mt-2 md:mt-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Palette className="text-emerald-500" size={28} />
                        Configurações e Branding
                    </h2>
                    <p className="text-slate-500 mt-1">Personalize o visual e a marca da sua barbearia para o cliente.</p>
                </header>

                <ConfiguracoesClient
                    initialNome={config.nome_negocio || 'StudioManager'}
                    initialLogo={config.logo_url || null}
                />

            </main>
        </div>
    );
}
