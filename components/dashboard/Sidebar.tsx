'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    Menu,
    TrendingUp,
    Users,
    CalendarDays,
    Briefcase,
    UserCog,
    Settings,
    LogOut
} from 'lucide-react';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';

interface SidebarProps {
    initialNome?: string;
    initialLogo?: string | null;
}

export default function Sidebar({ initialNome = 'StudioManager', initialLogo = null }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [nomeNegocio, setNomeNegocio] = React.useState(initialNome);
    const [logoUrl, setLogoUrl] = React.useState<string | null>(initialLogo);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const loadConfig = () => {
        getConfiguracaoAction().then((res: any) => {
            setNomeNegocio(res.nome_negocio || 'StudioManager');
            setLogoUrl(res.logo_url || null);
        });
    };

    React.useEffect(() => {
        const handleConfigUpdate = () => {
            loadConfig();
        };

        window.addEventListener('configUpdated', handleConfigUpdate);
        return () => window.removeEventListener('configUpdated', handleConfigUpdate);
    }, []);

    const getLinkClass = (href: string) => {
        // Exact match for most pages, or "#" for unimplemented
        const isActive = pathname === href;
        if (isActive) {
            return "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 font-medium transition-colors";
        }
        return "flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors";
    };

    return (
        <>
            {/* Sidebar Mobile Navigation */}
            <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm border-b border-slate-100 sticky top-0 z-20 w-full">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${logoUrl ? 'bg-transparent' : 'bg-emerald-600'}`}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-white font-bold text-lg">{nomeNegocio.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <h1 className="font-semibold text-lg text-slate-800">{nomeNegocio}</h1>
                </div>
                <button
                    className="p-2 bg-slate-100 rounded-md text-slate-600"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-30 transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Desktop & Mobile */}
            <aside className={`fixed flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm h-full z-40 top-0 left-0 transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${logoUrl ? 'bg-transparent' : 'bg-emerald-600 shadow-md shadow-emerald-200'}`}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-white font-bold text-xl">{nomeNegocio.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <h1 className="font-bold text-xl tracking-tight text-slate-800 truncate">{nomeNegocio}</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/" className={getLinkClass('/')}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link href="/servicos" className={getLinkClass('/servicos')}>
                        <Briefcase size={20} />
                        Serviços
                    </Link>
                    <Link href="/clientes" className={getLinkClass('/clientes')}>
                        <Users size={20} />
                        Clientes
                    </Link>
                    <Link href="/agenda" className={getLinkClass('/agenda')}>
                        <CalendarDays size={20} />
                        Agenda
                    </Link>
                    <Link href="/profissionais" className={getLinkClass('/profissionais')}>
                        <UserCog size={20} />
                        Profissionais
                    </Link>
                    <Link href="/financeiro" className={getLinkClass('/financeiro')}>
                        <TrendingUp size={20} />
                        Financeiro
                    </Link>
                    <Link href="/configuracoes" className={getLinkClass('/configuracoes')}>
                        <Settings size={20} />
                        Configurações
                    </Link>
                </nav>

                {/* Painel do Usuário logado e Logout */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    {session?.user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col overflow-hidden max-w-[150px]">
                                <span className="text-sm font-bold text-slate-800 truncate">
                                    {(session.user as any).name || 'Usuário'}
                                </span>
                                <span className="text-xs text-slate-500 truncate">
                                    {(session.user as any).role || 'ADMIN'}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Sair do sistema"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    )}

                    {/* Assinatura "White-Label" */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 text-center">
                        <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                            ⚡ Powered by StudioManager
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}
