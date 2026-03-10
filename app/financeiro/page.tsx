import React from 'react';
import prisma from '@/lib/prisma';
import Sidebar from '@/components/dashboard/Sidebar';
import NewExpenseModal from '@/components/dashboard/NewExpenseModal';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';

export const dynamic = 'force-dynamic';

export default async function FinanceiroPage() {
    const [transacoes, config] = await Promise.all([
        prisma.transacao.findMany({
            orderBy: { data: 'desc' }
        }),
        getConfiguracaoAction()
    ]);

    const totalEntradas = transacoes.filter((t: any) => t.tipo === 'ENTRADA').reduce((acc: number, curr: any) => acc + curr.valor, 0);
    const totalSaidas = transacoes.filter((t: any) => t.tipo === 'SAIDA').reduce((acc: number, curr: any) => acc + curr.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />
            <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
                <header className="mb-8 mt-2 md:mt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Financeiro</h2>
                        <p className="text-slate-500 mt-1">Gestão de receitas e despesas.</p>
                    </div>
                    <NewExpenseModal />
                </header>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {/* Entradas */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total de Entradas</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalEntradas)}</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
                        </div>
                    </div>
                    {/* Saidas */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total de Saídas</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalSaidas)}</h3>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20} /></div>
                        </div>
                    </div>
                    {/* Saldo */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Saldo do Período</p>
                                <h3 className={`text-2xl font-bold mt-1 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(saldo)}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600"><Wallet size={20} /></div>
                        </div>
                    </div>
                </div>

                {/* Histórico Tabela */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Histórico de Transações</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-sm text-slate-500 uppercase tracking-wider">
                                    <th className="py-4 px-6 font-medium">Data</th>
                                    <th className="py-4 px-6 font-medium">Descrição</th>
                                    <th className="py-4 px-6 font-medium text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transacoes.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                                            {format(new Date(t.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${t.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} shadow-sm`}>
                                                    {t.tipo === 'ENTRADA' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{t.descricao}</span>
                                            </div>
                                        </td>
                                        <td className={`py-4 px-6 text-sm font-bold text-right ${t.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {t.tipo === 'ENTRADA' ? '+' : '-'}{formatCurrency(t.valor)}
                                        </td>
                                    </tr>
                                ))}
                                {transacoes.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-slate-500">Nenhuma transação encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
