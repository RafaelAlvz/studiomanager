import React from 'react';
import prisma from '@/lib/prisma';
import { LayoutDashboard, Users, Menu, Scissors } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import ClientesManager from './ClientesManager';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: {
        select: { agendamentos: true }
      }
    }
  });

  const config = await getConfiguracaoAction();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                Gestão de Clientes
              </h1>
              <p className="text-slate-500 mt-1">Gerencie contatos, visualize histórico de atendimento e dados únicos.</p>
            </div>
          </header>

          <ClientesManager initialClientes={clientes} />

        </div>
      </main>
    </div>
  );
}
