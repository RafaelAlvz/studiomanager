"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Minus, Receipt } from 'lucide-react';
import { createExpense } from '@/app/actions/finance';
import toast from 'react-hot-toast';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';

export default function NewExpenseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!descricao || !valor || !data) {
        throw new Error("Preencha todos os campos.");
      }

      // Constrói data local sem fuso horário zoado do input date (YYYY-MM-DD -> T00:00:00)
      const dataFormatada = `${data}T12:00:00.000Z`;

      await createExpense({
        descricao,
        valor: parseCurrencyInput(valor),
        data_transacao: dataFormatada
      });

      toast.success("Despesa registrada com sucesso!");
      setIsOpen(false);
      resetForm();
      router.refresh();

    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao registrar a despesa.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDescricao("");
    setValor("");
    setData("");
  }

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
      >
        <Minus size={18} className="text-red-500" />
        Registrar Despesa
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                  <Receipt size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Nova Despesa</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleSubmit} className="p-6">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Conta de Luz, Aluguel, Produtos..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                    <input
                      type="text"
                      required
                      placeholder="R$ 0,00"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                      value={valor}
                      onChange={e => setValor(formatCurrencyInput(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      value={data}
                      onChange={e => setData(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Salvando...' : 'Registrar Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
