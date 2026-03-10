import React from 'react';
import prisma from '@/lib/prisma';
import Sidebar from '@/components/dashboard/Sidebar';
import EditProfissionalModal from './EditProfissionalModal';
import NewProfissionalModal from './NewProfissionalModal';
import EditBasicProfissionalModal from './EditBasicProfissionalModal';
import DeleteProfissionalButton from './DeleteProfissionalButton';
import ProfissionalFooterID from './ProfissionalFooterID';
import { Clock, CalendarDays, User } from 'lucide-react';
import { getConfiguracaoAction } from '@/lib/actions/configuracao-actions';

export const revalidate = 0;

export default async function ProfissionaisPage() {
  const profissionais = await prisma.profissional.findMany({
    orderBy: { nome: 'asc' }
  });

  const config = await getConfiguracaoAction();

  const diasSemanaMap: Record<string, string> = {
    '0': 'Dom', '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Sidebar initialNome={config.nome_negocio} initialLogo={config.logo_url} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-7xl mx-auto">
        <header className="mb-8 mt-2 md:mt-0 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Equipe e Expediente</h2>
            <p className="text-slate-500 mt-1">Gerencie os profissionais cadastrados e suas regras de horários.</p>
          </div>
          <div className="flex-shrink-0">
            <NewProfissionalModal />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map((prof) => {
            const diasTrabalhoNomes = prof.diasTrabalho
              .split(',')
              .map(d => diasSemanaMap[d])
              .join(', ');

            return (
              <div key={prof.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow relative group">
                {/* Ações Globais: Editar Dados Básicos e Excluir */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <EditBasicProfissionalModal profissional={prof} />
                  <DeleteProfissionalButton id={prof.id} nome={prof.nome} />
                </div>

                <div className="flex items-center gap-4 mb-4 pr-16">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{prof.nome}</h3>
                    <p className="text-sm text-gray-500">{prof.especialidade || 'Profissional'}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <CalendarDays size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Dias de Trabalho:</span>
                      <p className="text-gray-500 leading-snug mt-1">{diasTrabalhoNomes}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Clock size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Expediente:</span>
                      <p className="text-gray-500 leading-snug mt-1">{prof.inicioExpediente} às {prof.fimExpediente}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                  <EditProfissionalModal profissional={prof} />
                </div>

                {/* Footer Identificador para Webhooks / APIs */}
                <ProfissionalFooterID id={prof.id} />
              </div>
            );
          })}

          {profissionais.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-200 border-dashed rounded-xl">
              Nenhum profissional cadastrado no sistema.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
