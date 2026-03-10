"use client";

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Wand2 } from 'lucide-react';
import { createServico, updateServico, deleteServico } from './actions';
import ProfissionalFooterID from '../profissionais/ProfissionalFooterID';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';

export default function ServicosManager({ initialServicos }: { initialServicos: any[] }) {
  const [servicos, setServicos] = useState(initialServicos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_servico: '',
    duracao: 30,
    tempoPreparacao: 0,
    preco: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ nome_servico: '', duracao: 30, tempoPreparacao: 0, preco: '' });
    setIsModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      nome_servico: s.nome_servico,
      duracao: s.duracao,
      tempoPreparacao: s.tempoPreparacao,
      preco: formatCurrencyInput(s.preco),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        nome_servico: formData.nome_servico,
        duracao: Number(formData.duracao),
        tempoPreparacao: Number(formData.tempoPreparacao),
        preco: parseCurrencyInput(formData.preco),
      };

      if (editingId) {
        await updateServico(editingId, payload);
        setServicos(servicos.map(s => s.id === editingId ? { ...s, ...payload } : s));
      } else {
        await createServico(payload);
        // Refresh local cache via window.location for simplicity, or we could let the server revalidation trigger a remount
        window.location.reload();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao salvar o serviço.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;
    setIsDeleting(id);
    try {
      await deleteServico(id);
      setServicos(servicos.filter(s => s.id !== id));
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao excluir o serviço.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      {/* Top Action */}
      <div className="flex justify-end mb-6">
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Cadastrar Serviço
        </button>
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-emerald-200 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800">{s.nome_servico}</h3>
              <div className="flex bg-slate-50 p-1.5 rounded-lg border border-slate-100 gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={isDeleting === s.id}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <DollarSign size={16} className="text-emerald-600 mr-2" />
                <span className="font-medium">{formatCurrency(s.preco)}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <Clock size={16} className="text-blue-500 mr-2" />
                <span className="font-medium">{s.duracao} min</span>
                <span className="text-slate-400 ml-1">de duração</span>
              </div>
              {s.tempoPreparacao > 0 && (
                <div className="flex items-center text-sm text-slate-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100/50">
                  <Wand2 size={16} className="text-amber-500 mr-2" />
                  <span className="font-medium text-amber-900">{s.tempoPreparacao} min</span>
                  <span className="text-amber-700/70 ml-1">de preparação/limpeza</span>
                </div>
              )}
              {s.tempoPreparacao === 0 && (
                <div className="flex items-center text-sm text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                  <Wand2 size={16} className="text-slate-300 mr-2" />
                  Sem tempo de preparo
                </div>
              )}
            </div>

            <ProfissionalFooterID id={s.id} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degrade"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={formData.nome_servico}
                  onChange={e => setFormData({ ...formData, nome_servico: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço</label>
                <input
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.preco}
                  onChange={e => setFormData({ ...formData, preco: formatCurrencyInput(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duração (Minutos)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={formData.duracao || ''}
                    onChange={e => setFormData({ ...formData, duracao: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preparo (Minutos)</label>
                  <input
                    type="number"
                    placeholder="Tempo extra"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={formData.tempoPreparacao || ''}
                    onChange={e => setFormData({ ...formData, tempoPreparacao: Number(e.target.value) })}
                  />
                  <p className="text-xs text-slate-400 mt-1">Tempo extra p/ limpeza</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
