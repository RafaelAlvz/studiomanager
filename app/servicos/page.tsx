import React from 'react';
import prisma from '@/lib/prisma';
import { LayoutDashboard, Scissors, Menu } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import ServicosManager from './ServicosManager';

export default async function ServicosPage() {
  const servicos = await prisma.servico.findMany({
    where: { ativo: true },
    orderBy: { nome_servico: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                Gestão de Serviços
              </h1>
              <p className="text-slate-500 mt-1">Cadastre, edite e controle a inteligência de tempo dos serviços.</p>
            </div>
          </header>

          <ServicosManager initialServicos={servicos} />

        </div>
      </main>
    </div>
  );
}
