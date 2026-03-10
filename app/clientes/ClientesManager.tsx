"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { createCliente, updateCliente, deleteCliente } from './actions';
import PhoneInput, { formatPhoneNumberIntl, isValidPhoneNumber } from 'react-phone-number-input';
import '@/app/phone-input.css';

export default function ClientesManager({ initialClientes }: { initialClientes: any[] }) {
  const [clientes, setClientes] = useState(initialClientes);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone_whatsapp: '',
  });

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone_whatsapp.includes(searchTerm)
  );

  const openNew = () => {
    setEditingId(null);
    setFormData({ nome: '', telefone_whatsapp: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      nome: c.nome,
      telefone_whatsapp: c.telefone_whatsapp,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return phone;
    // Attempt to use the library's intl formatting first
    try {
      if (phone.startsWith('+')) {
        return formatPhoneNumberIntl(phone);
      }
    } catch (e) { }

    // Fallback basic formatter for old data
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateCliente(editingId, formData);
      } else {
        await createCliente(formData);
      }
      setIsModalOpen(false);
      window.location.reload(); // Quick sync
    } catch (err: any) {
      setError(err.message || "Houve um erro ao salvar o cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;
    setIsDeleting(id);
    try {
      await deleteCliente(id);
      setClientes(clientes.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.message || "Houve um erro ao excluir o cliente.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      {/* Top Actions & Search */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Contato (WhatsApp)</th>
                <th className="px-6 py-4 font-medium">Histórico</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : filteredClientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{c.nome}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="text-emerald-500" />
                      {formatPhone(c.telefone_whatsapp)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-600 flex items-center gap-1.5 object-contain">
                        <CalendarIcon size={14} className="text-blue-500" />
                        {c._count?.agendamentos || 0} visitas
                      </span>
                      {c.total_faltas > 0 && (
                        <span className="text-xs text-red-500 mt-0.5">{c.total_faltas} faltas registradas</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isDeleting === c.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (WhatsApp)</label>
                  <PhoneInput
                    international
                    defaultCountry="BR"
                    limitMaxLength
                    value={formData.telefone_whatsapp}
                    onChange={(value) => setFormData({ ...formData, telefone_whatsapp: value || '' })}
                    className={`w-full bg-slate-50 border ${formData.telefone_whatsapp && !isValidPhoneNumber(formData.telefone_whatsapp) ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500' : 'border-slate-200 focus-within:ring-emerald-500/20 focus-within:border-emerald-500'} text-slate-900 rounded-xl px-4 py-2.5 outline-none focus-within:ring-2 transition-all`}
                  />
                  {formData.telefone_whatsapp && !isValidPhoneNumber(formData.telefone_whatsapp) ? (
                    <p className="text-xs text-red-500 mt-1 font-medium">O número de telefone fornecido é inválido.</p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Usado também para identificar o cliente e enviar mensagens.</p>
                  )}
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
                  disabled={isSaving || !formData.telefone_whatsapp || !isValidPhoneNumber(formData.telefone_whatsapp)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
