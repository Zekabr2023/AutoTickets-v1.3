import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Empresa } from '../lib/authService';
import { useToast } from './ToastProvider';

interface ClientSettingsModalProps {
    empresa: Empresa;
    onClose: () => void;
    onUpdate: (empresa: Empresa) => void;
}

export const ClientSettingsModal: React.FC<ClientSettingsModalProps> = ({ empresa, onClose, onUpdate }) => {
    const toast = useToast();
    const [email, setEmail] = useState(empresa.email_notificacao || '');
    // WhatsApp sem o 55 para exibição se já tiver
    const initialWhatsapp = empresa.whatsapp_notificacao ? empresa.whatsapp_notificacao.replace(/^55/, '') : '';
    const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const fullWhatsapp = whatsapp ? `55${whatsapp.replace(/\D/g, '')}` : '';

        try {
            const { data, error } = await supabase
                .from('empresas')
                .update({
                    email_notificacao: email,
                    whatsapp_notificacao: fullWhatsapp
                })
                .eq('id', empresa.id)
                .select()
                .single();

            if (error) throw error;

            toast.success('Preferências atualizadas com sucesso!');
            onUpdate(data as Empresa);
            onClose();
        } catch (error: any) {
            console.error('Erro ao atualizar preferências:', error);
            toast.error('Erro ao atualizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">🔔 Preferências de Notificação</h2>
                <p className="text-sm text-gray-400 mb-6">
                    Informe onde você deseja receber atualizações sobre seus tickets.
                </p>

                <form onSubmit={handleSave}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email para Notificações</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp para Notificações</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-gray-700 text-gray-400 sm:text-sm shadow-sm">
                                    +55
                                </span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border border-gray-600 bg-gray-900 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="11999999999"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">DDD + Número (apenas números)</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
