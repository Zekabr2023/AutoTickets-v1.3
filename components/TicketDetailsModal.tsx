import React, { useState, useRef, useEffect } from 'react';
import { Ticket, UrgencyLevel, TicketStatus } from '../types';
import { CloseIcon } from './icons';
import { ticketService } from '../lib/ticketService'; // Importar serviço
import { useToast } from './ToastProvider';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onDelete?: (ticketId: string) => Promise<void>;
  onTicketUpdated?: () => void; // Callback para atualizar lista
}

const getUrgencyStyles = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case UrgencyLevel.Critical: return 'bg-red-500/20 text-red-300 border-red-500/50';
    case UrgencyLevel.High: return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    case UrgencyLevel.Medium: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    case UrgencyLevel.Low: return 'bg-sky-500/20 text-sky-300 border-sky-500/50';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  }
}


export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose, onDelete, onTicketUpdated }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [resposta, setResposta] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  // Estado local para chat otimista
  const [localChatHistory, setLocalChatHistory] = useState<{ sender: 'Admin' | 'Client'; message: string; timestamp: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (ticket) {
      // Lógica para evitar "flicker" (piscar) do histórico se o update do servidor ainda não tiver a mensagem nova
      if (ticket.id !== lastTicketId) {
        // Se mudou de ticket, carrega o histórico novo do banco
        setLocalChatHistory(ticket.chatHistory || []);
        setLastTicketId(ticket.id);
      } else {
        // Se é o mesmo ticket, mesclar com cuidado ou preservar o local se for mais recente
        const remoteHistory = ticket.chatHistory || [];
        setLocalChatHistory(prev => {
          if (remoteHistory.length >= prev.length) return remoteHistory;
          return prev;
        });
      }
    }
  }, [ticket, lastTicketId]);

  // Auto-scroll usando scrollTop (não move a página inteira)
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [localChatHistory]);

  if (!ticket) return null;

  const handleResponder = async () => {
    if (!resposta.trim()) return;

    const newMessage = {
      sender: 'Client' as const,
      message: resposta.trim(),
      timestamp: new Date().toISOString()
    };

    // Optimistic Update
    setLocalChatHistory(prev => [...prev, newMessage]);
    setResposta('');

    // Force scroll
    setTimeout(() => {
      if (chatContainerRef.current) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
      }
    }, 50);

    setIsResponding(true);
    try {
      const resultado = await ticketService.responderSolicitacao(ticket.id, newMessage.message);
      if (resultado.success) {
        if (onTicketUpdated) onTicketUpdated();
      } else {
        toast.error('Erro ao enviar resposta: ' + resultado.error);
        setLocalChatHistory(prev => prev.filter(m => m !== newMessage));
        setResposta(newMessage.message);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
      setLocalChatHistory(prev => prev.filter(m => m !== newMessage));
    } finally {
      setIsResponding(false);
    }
  };

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
      toast.error('Erro ao deletar ticket. Tente novamente.');
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
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in'
        }`}
    >
      <div
        className={`bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'animate-slide-up'
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Solicitante</h3>
              <p className="text-lg text-white mt-1 truncate" title={ticket.solicitanteNome}>{ticket.solicitanteNome || 'Não informado'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase">IA Relacionada</h3>
              <p className="text-lg text-white mt-1">{ticket.aiName}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Status</h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block mt-1 ${(ticket.status === 'Pending' || ticket.status === 'AwaitingInfo')
                ? 'bg-yellow-500/20 text-yellow-300'
                : ticket.status === 'InAnalysis'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-green-500/20 text-green-300'
                }`}>
                {ticket.status === 'Pending'
                  ? 'Pendente'
                  : ticket.status === 'InAnalysis'
                    ? 'Em Análise'
                    : ticket.status === 'AwaitingInfo'
                      ? 'Aguardando Informação'
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

          {/* Chat / Solicitação de Informação */}
          {(ticket.status === 'AwaitingInfo' || (ticket.chatHistory && ticket.chatHistory.length > 0)) && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-lg mb-6 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💬</span>
                <h3 className="text-lg font-bold text-yellow-500 uppercase">Histórico de Atendimento</h3>
              </div>

              <div
                ref={chatContainerRef}
                className="flex flex-col gap-3 mb-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar p-2 bg-gray-900/50 rounded border border-gray-700/50 scroll-smooth"
              >
                {localChatHistory && localChatHistory.length > 0 ? (
                  localChatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'Client' ? 'items-end' : 'items-start'} animate-fade-in`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'Client' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-700 text-gray-200 rounded-tl-sm'}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1 opacity-70">
                        {msg.sender === 'Client' ? 'Você' : 'Suporte'} • {new Date(msg.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  (!ticket.chatHistory || ticket.chatHistory.length === 0) && ticket.solicitacaoInfo && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] rounded-lg p-3 text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded-tl-none">
                        <p className="whitespace-pre-wrap">{ticket.solicitacaoInfo}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">Suporte • Anteriormente</span>
                    </div>
                  )
                )}
              </div>

              {ticket.status === 'AwaitingInfo' && (
                <div className="animate-fade-in">
                  <label className="text-yellow-200 text-sm font-semibold mb-2 block">Sua Resposta:</label>
                  <div className="flex items-center gap-2 bg-gray-900 border border-yellow-500/30 rounded-full px-4 py-1 focus-within:ring-2 focus-within:ring-yellow-500/50 transition-all shadow-inner">
                    <textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (resposta.trim()) handleResponder();
                        }
                      }}
                      placeholder="Digite aqui as informações solicitadas..."
                      className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-500 py-3 px-0 min-h-[44px] max-h-32 resize-none leading-snug outline-none shadow-none ring-0 w-full"
                      style={{ height: '44px', boxShadow: 'none' }}
                    />
                    <button
                      onClick={handleResponder}
                      disabled={isResponding || !resposta.trim()}
                      className="w-10 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shrink-0 transform hover:scale-105 active:scale-95"
                      title="Enviar"
                    >
                      {isResponding ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
            {/* Seção de Solução - Visível quando resolvido */}
            {ticket.solucao && (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <h3 className="text-sm font-semibold text-green-400 uppercase">Solução do Problema</h3>
                </div>
                <p className="text-gray-200 mt-2 whitespace-pre-wrap">{ticket.solucao}</p>

                {/* Exibir Anexos da Solução */}
                {ticket.attachmentsSolution && ticket.attachmentsSolution.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-500/30">
                    <h5 className="text-xs font-semibold text-green-400/80 mb-2 uppercase">Evidências / Anexos da Solução:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {ticket.attachmentsSolution.map((att, index) => (
                        <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="block group">
                          <img src={att.url} alt={att.name} className="w-full h-32 object-cover rounded-md border-2 border-transparent group-hover:border-green-500 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.resolvidoPor && (
                  <p className="text-xs text-green-500/60 mt-4 text-right">
                    Resolvido por: {ticket.resolvidoPor} em {ticket.resolvidoEm ? new Date(ticket.resolvidoEm).toLocaleDateString('pt-BR') : '-'}
                  </p>
                )}
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
