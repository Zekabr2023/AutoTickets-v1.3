import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';
import { Empresa } from '../lib/authService';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastProvider';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: Empresa;
  onUpdate: (empresa: Empresa) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  empresa,
  onUpdate
}) => {
  const toast = useToast();
  const [email, setEmail] = useState(empresa.email_notificacao || '');
  const [whatsapp, setWhatsapp] = useState(empresa.whatsapp_notificacao || '');
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(empresa.notificacoes_ativas ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(empresa.email_notificacao || '');
      setWhatsapp(empresa.whatsapp_notificacao || '');
      setNotificacoesAtivas(empresa.notificacoes_ativas ?? true);
      setSaveSuccess(false);
    }
  }, [isOpen, empresa]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .update({
          email_notificacao: email.trim() || null,
          whatsapp_notificacao: whatsapp.trim() || null,
          notificacoes_ativas: notificacoesAtivas,
        })
        .eq('id', empresa.id)
        .select('id, nome_empresa, ultimo_login, email_notificacao, whatsapp_notificacao, notificacoes_ativas, is_admin, criado_em, atualizado_em')
        .single();

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações. Tente novamente.');
        setIsSaving(false);
        return;
      }

      // Atualizar empresa logada
      if (data) {
        onUpdate(data);
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <h2 className="text-2xl font-bold text-white">Configurações de Notificações</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Toggle de Notificações */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Receber Notificações</h3>
                <p className="text-sm text-gray-400 mt-1">Ativar alertas de novos tickets e atualizações</p>
              </div>
              <button
                onClick={() => setNotificacoesAtivas(!notificacoesAtivas)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${notificacoesAtivas ? 'bg-indigo-600' : 'bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${notificacoesAtivas ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              📧 Email para Notificações
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!notificacoesAtivas}
              placeholder="seu@email.com"
              className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Receberá emails sobre novos tickets e atualizações</p>
          </div>

          {/* WhatsApp */}
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300 mb-2">
              💬 WhatsApp para Notificações
            </label>
            <input
              type="tel"
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={!notificacoesAtivas}
              placeholder="(11) 99999-9999"
              className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Receberá mensagens pelo WhatsApp sobre tickets</p>
          </div>

          {/* Mensagem de Sucesso */}
          {saveSuccess && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center animate-fade-in">
              <p className="text-green-300 font-semibold">✅ Configurações salvas com sucesso!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};








