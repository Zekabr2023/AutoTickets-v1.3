import React, { useState, useRef, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { ticketService } from '../lib/ticketService';
import { useToast } from './ToastProvider';

interface AdminTicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated: () => void;
  adminName?: string;
}

export const AdminTicketModal: React.FC<AdminTicketModalProps> = ({
  ticket,
  onClose,
  onTicketUpdated,
  adminName
}) => {
  const [solucao, setSolucao] = useState('');
  const [solicitacao, setSolicitacao] = useState('');
  const [isResolvendo, setIsResolvendo] = useState(false);
  const [isSolicitando, setIsSolicitando] = useState(false);
  const [novoStatus, setNovoStatus] = useState<TicketStatus>(TicketStatus.Pending);
  const [imagensSolucao, setImagensSolucao] = useState<File[]>([]);

  // Estado local para chat otimista
  const [localChatHistory, setLocalChatHistory] = useState<{ sender: 'Admin' | 'Client'; message: string; timestamp: string; adminName?: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (ticket) {
      setSolucao(ticket.solucao || '');
      setSolicitacao('');
      setNovoStatus(ticket.status);
      setImagensSolucao([]);

      if (ticket.id !== lastTicketId) {
        setLocalChatHistory(ticket.chatHistory || []);
        setLastTicketId(ticket.id);
      } else {
        const remoteHistory = ticket.chatHistory || [];
        setLocalChatHistory(prev => {
          if (remoteHistory.length >= prev.length) return remoteHistory;
          return prev;
        });
      }
    }
  }, [ticket, lastTicketId]);

  // ... auto-scroll useEffect ...

  const handleSolicitarInformacao = async () => {
    if (!ticket || !solicitacao.trim()) return;

    setIsSolicitando(true);

    // Otimista
    const newMessage = {
      sender: 'Admin' as const,
      adminName: adminName,
      message: solicitacao,
      timestamp: new Date().toISOString()
    };
    setLocalChatHistory(prev => [...prev, newMessage]);

    const result = await ticketService.solicitarInformacao(ticket.id, solicitacao, adminName);

    if (result.success) {
      setSolicitacao('');
      onTicketUpdated();
    } else {
      toast.error('Erro ao enviar solicitação.');
      // Rollback otimista se falhar (opcional, mas recomendado)
      setLocalChatHistory(prev => prev.filter(msg => msg !== newMessage));
    }

    setIsSolicitando(false);
  };
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [localChatHistory]);

  if (!ticket) return null;

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      const files = Array.from(e.clipboardData.files).filter((file: any) => file.type.startsWith('image/'));
      setImagensSolucao(prev => [...prev, ...files]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file: any) => file.type.startsWith('image/'));
      setImagensSolucao(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImagensSolucao(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to format timestamp
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleResolverTicket = async () => {
    if (!solucao.trim()) {
      toast.warning('Por favor, descreva a solução do problema.');
      return;
    }

    setIsResolvendo(true);
    try {
      // @ts-ignore
      const resultado = await ticketService.resolverTicket(
        ticket.id,
        solucao.trim(),
        'Admin',
        imagensSolucao
      );

      if (resultado.success) {
        toast.success('Ticket resolvido com sucesso!');
        onTicketUpdated();
        onClose();
      } else {
        toast.error('Erro ao resolver ticket: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao resolver ticket:', error);
      toast.error('Erro ao resolver ticket');
    } finally {
      setIsResolvendo(false);
    }
  };



  const handleAtualizarStatus = async () => {
    try {
      const resultado = await ticketService.atualizarStatusTicket(ticket.id, novoStatus);

      if (resultado.success) {
        toast.success('Status atualizado com sucesso!');
        onTicketUpdated();
      } else {
        toast.error('Erro ao atualizar status: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagensSolucao(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.Pending:
        return 'text-yellow-400 bg-yellow-500/20';
      case TicketStatus.InAnalysis:
        return 'text-blue-400 bg-blue-500/20';
      case TicketStatus.Resolved:
        return 'text-green-400 bg-green-500/20';
      case TicketStatus.AwaitingInfo:
        return 'text-orange-400 bg-orange-500/20';
      case TicketStatus.Archived:
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Crítica':
        return 'text-red-400 bg-red-500/20';
      case 'Alta':
        return 'text-orange-400 bg-orange-500/20';
      case 'Média':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'Baixa':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.Pending:
        return 'Pendente';
      case TicketStatus.InAnalysis:
        return 'Em Análise';
      case TicketStatus.Resolved:
        return 'Resolvido';
      case TicketStatus.AwaitingInfo:
        return 'Aguardando Informação';
      case TicketStatus.Archived:
        return 'Arquivado';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-600">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            Ticket #{String(ticket.numero).padStart(4, '0')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Ticket */}
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">📋 Informações do Ticket</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300">Título:</label>
                  <p className="text-white font-medium">{ticket.title}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-300">Cliente:</label>
                  <p className="text-white font-medium">{ticket.empresaNome || 'Não Identificado'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-300">IA:</label>
                  <p className="text-white">{ticket.aiName}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <label className="text-sm text-gray-300">Status:</label>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300">Urgência:</label>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300">Criado em:</label>
                  <p className="text-white">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
                </div>

                {ticket.resolvidoEm && (
                  <div>
                    <label className="text-sm text-gray-300">Resolvido em:</label>
                    <p className="text-white">{new Date(ticket.resolvidoEm).toLocaleString('pt-BR')}</p>
                  </div>
                )}

                {ticket.resolvidoPor && (
                  <div>
                    <label className="text-sm text-gray-300">Resolvido por:</label>
                    <p className="text-white">{ticket.resolvidoPor}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">📝 Descrição do Problema</h4>
              <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">🎯 O que deveria acontecer</h4>
              <p className="text-gray-300 whitespace-pre-wrap">{ticket.whatShouldHappen}</p>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">📎 Anexos</h4>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-300">📎</span>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {attachment.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ações do Admin */}
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">⚙️ Ações Administrativas</h4>

              <div className="space-y-4">
                {/* Solicitar Informação / Chat */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-500 uppercase flex items-center gap-2 mb-3">
                    <span>⚠️</span> Histórico de Solicitações
                  </h4>

                  {/* Chat History Container */}
                  <div
                    ref={chatContainerRef}
                    className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar p-2 bg-gray-900/30 rounded-lg scroll-smooth"
                  >
                    {localChatHistory && localChatHistory.length > 0 ? (
                      localChatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'Admin' ? 'items-end' : 'items-start'} animate-fade-in`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'Admin' ? 'bg-yellow-600 text-white rounded-tr-sm' : 'bg-gray-700 text-gray-200 rounded-tl-sm'}`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1 opacity-70">
                            {msg.sender === 'Admin' ? (msg.adminName || 'Admin') : 'Cliente'} • {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500 opacity-60">
                        <span className="text-2xl mb-2">💬</span>
                        <p className="text-xs italic">Nenhuma interação registrada.</p>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="flex items-center gap-2 bg-gray-700 rounded-full px-4 py-1 border border-gray-600 focus-within:ring-2 focus-within:ring-yellow-500/50 transition-all shadow-inner">
                    <textarea
                      value={solicitacao}
                      onChange={(e) => setSolicitacao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (solicitacao.trim()) handleSolicitarInformacao();
                        }
                      }}
                      placeholder="Digite uma mensagem..."
                      className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-400 py-3 px-0 min-h-[44px] max-h-32 resize-none leading-snug outline-none shadow-none ring-0 w-full"
                      style={{ height: '44px', boxShadow: 'none' }}
                    />
                    <button
                      onClick={handleSolicitarInformacao}
                      disabled={isSolicitando || !solicitacao.trim()}
                      className="w-10 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shrink-0 transform hover:scale-105 active:scale-95"
                      title="Enviar"
                    >
                      {isSolicitando ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Atualizar Status */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Alterar Status:</label>
                  <div className="flex gap-2">
                    <select
                      value={novoStatus}
                      onChange={(e) => setNovoStatus(e.target.value as TicketStatus)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={TicketStatus.Pending}>Pendente</option>
                      <option value={TicketStatus.InAnalysis}>Em Análise</option>
                      <option value={TicketStatus.Resolved}>Resolvido</option>
                      <option value={TicketStatus.AwaitingInfo}>Aguardando Informação</option>
                      <option value={TicketStatus.Archived}>📦 Arquivado</option>
                    </select>
                    <button
                      onClick={handleAtualizarStatus}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>

                {/* Resolver Ticket (Enhanced UI) */}
                {ticket.status !== TicketStatus.Resolved && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Solução do Problema:</label>
                    <div
                      className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-opacity-50"
                      onPaste={handlePaste}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <textarea
                        value={solucao}
                        onChange={(e) => setSolucao(e.target.value)}
                        placeholder="Descreva a solução... (Cole imagens com Ctrl+V ou arraste)"
                        className="w-full px-3 py-2 bg-transparent text-white focus:outline-none h-32 resize-none border-b border-gray-600/50"
                      />

                      {/* Toolbar / Image Previews */}
                      <div className="p-2 bg-gray-800/50 min-h-[40px] flex flex-wrap items-center gap-2">
                        {/* Image Previews */}
                        {imagensSolucao.map((file, idx) => (
                          <div key={idx} className="relative group w-12 h-12 rounded border border-gray-500 overflow-hidden bg-gray-900">
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Upload Button */}
                        <label className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition" title="Anexar Imagem">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </label>
                        <span className="text-xs text-gray-500 ml-auto pointer-events-none">
                          {imagensSolucao.length === 0 ? 'Arraste ou cole imagens' : `${imagensSolucao.length} imagens`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleResolverTicket}
                      disabled={isResolvendo || !solucao.trim()}
                      className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                    >
                      {isResolvendo ? 'Resolvendo e Enviando...' : 'Resolver Ticket'}
                    </button>
                  </div>
                )}

                {/* Solução Existente */}
                {ticket.solucao && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Solução Aplicada:</label>
                    <div className="bg-gray-600/50 rounded-lg p-3">
                      <p className="text-white whitespace-pre-wrap">{ticket.solucao}</p>

                      {/* Exibir Anexos da Solução */}
                      {ticket.attachmentsSolution && ticket.attachmentsSolution.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-500/30">
                          <h5 className="text-xs font-semibold text-gray-400 mb-2">EVIDÊNCIAS / ANEXOS:</h5>
                          <div className="flex flex-wrap gap-2">
                            {ticket.attachmentsSolution.map((img, idx) => (
                              <a
                                key={idx}
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-20 h-20 rounded overflow-hidden border border-gray-500 hover:border-indigo-400 transition"
                              >
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
