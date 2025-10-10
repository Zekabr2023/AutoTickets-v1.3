import React, { useState } from 'react';
import { Ticket, UrgencyLevel } from '../types';
import { CloseIcon } from './icons';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onDelete?: (ticketId: string) => Promise<void>;
}

const getUrgencyStyles = (urgency: UrgencyLevel) => {
    switch(urgency) {
        case UrgencyLevel.Critical: return 'bg-red-500/20 text-red-300 border-red-500/50';
        case UrgencyLevel.High: return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
        case UrgencyLevel.Medium: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
        case UrgencyLevel.Low: return 'bg-sky-500/20 text-sky-300 border-sky-500/50';
        default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
}


export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose, onDelete }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!ticket) return null;

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) {
      console.error('onDelete não está definido!');
      return;
    }
    
    console.log('[Modal] 🎬 Iniciando animação de deleção...');
    setIsDeleting(true);
    setIsClosing(true);
    
    try {
      // Animar saída do modal
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Chamar função de delete (que é otimista)
      console.log('[Modal] 🗑️ Executando deleção...');
      await onDelete(ticket.id);
      
      console.log('[Modal] ✅ UI atualizada! (Banco será limpo em 15s)');
      
      // Fechar modal
      onClose();
    } catch (error) {
      console.error('[Modal] ❌ Erro ao deletar ticket:', error);
      alert('Erro ao deletar ticket. Tente novamente.');
      setIsDeleting(false);
      setIsClosing(false);
      setShowConfirmDelete(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'animate-fade-in'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'animate-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-lg font-bold">
              #{String(ticket.numero).padStart(4, '0')}
            </span>
            <h2 className="text-2xl font-bold text-white">Detalhes do Chamado</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">IA Relacionada</h3>
                    <p className="text-lg text-white mt-1">{ticket.aiName}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Status</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block mt-1 ${
                        ticket.status === 'Pending' 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : ticket.status === 'InAnalysis'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-green-500/20 text-green-300'
                    }`}>
                        {ticket.status === 'Pending' 
                          ? 'Pendente' 
                          : ticket.status === 'InAnalysis'
                          ? 'Em Análise'
                          : 'Resolvido'}
                    </span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Urgência</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block mt-1 border ${getUrgencyStyles(ticket.urgency)}`}>
                        {ticket.urgency}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Título</h3>
                    <p className="text-lg text-white mt-1">{ticket.title}</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Data de Abertura</h3>
                    <p className="text-lg text-white mt-1">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">O que está acontecendo?</h3>
                    <p className="text-white mt-2 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">O que deveria acontecer?</h3>
                    <p className="text-white mt-2 whitespace-pre-wrap">{ticket.whatShouldHappen}</p>
                </div>

                {ticket.attachments && ticket.attachments.length > 0 && (
                    <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Anexos</h3>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {ticket.attachments.map((att, index) => (
                        <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="block group">
                            <img src={att.url} alt={att.name} className="w-full h-32 object-cover rounded-md border-2 border-transparent group-hover:border-indigo-500 transition" />
                        </a>
                        ))}
                    </div>
                    </div>
                )}
            </div>

            {/* Botão de Deletar - Apenas se NÃO estiver Resolvido */}
            {onDelete && ticket.status !== 'Resolved' && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                {!showConfirmDelete ? (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full bg-red-600/20 text-red-300 font-semibold py-3 px-4 rounded-lg border-2 border-red-600/50 hover:bg-red-600/30 hover:border-red-600 transition-all duration-300"
                  >
                    🗑️ Cancelar/Excluir Chamado
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <p className="text-red-300 text-center font-semibold">
                        ⚠️ Tem certeza que deseja excluir este chamado?
                      </p>
                      <p className="text-red-400 text-sm text-center mt-2">
                        Esta ação não pode ser desfeita!
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                      >
                        Não, manter chamado
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="flex-1 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deletando...
                          </>
                        ) : (
                          'Sim, excluir permanentemente'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
