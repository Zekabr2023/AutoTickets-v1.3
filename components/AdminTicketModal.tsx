import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { ticketService } from '../lib/ticketService';

interface AdminTicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const AdminTicketModal: React.FC<AdminTicketModalProps> = ({ 
  ticket, 
  onClose, 
  onTicketUpdated 
}) => {
  const [solucao, setSolucao] = useState('');
  const [isResolvendo, setIsResolvendo] = useState(false);
  const [novoStatus, setNovoStatus] = useState<TicketStatus>(TicketStatus.Pending);

  React.useEffect(() => {
    if (ticket) {
      setSolucao(ticket.solucao || '');
      setNovoStatus(ticket.status);
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleResolverTicket = async () => {
    if (!solucao.trim()) {
      alert('Por favor, descreva a solução do problema.');
      return;
    }

    setIsResolvendo(true);
    try {
      const resultado = await ticketService.resolverTicket(
        ticket.id, 
        solucao.trim(), 
        'Admin'
      );

      if (resultado.success) {
        alert('Ticket resolvido com sucesso!');
        onTicketUpdated();
        onClose();
      } else {
        alert('Erro ao resolver ticket: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao resolver ticket:', error);
      alert('Erro ao resolver ticket');
    } finally {
      setIsResolvendo(false);
    }
  };

  const handleAtualizarStatus = async () => {
    try {
      const resultado = await ticketService.atualizarStatusTicket(ticket.id, novoStatus);
      
      if (resultado.success) {
        alert('Status atualizado com sucesso!');
        onTicketUpdated();
      } else {
        alert('Erro ao atualizar status: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
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
                    </select>
                    <button
                      onClick={handleAtualizarStatus}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>

                {/* Resolver Ticket */}
                {ticket.status !== TicketStatus.Resolved && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Solução do Problema:</label>
                    <textarea
                      value={solucao}
                      onChange={(e) => setSolucao(e.target.value)}
                      placeholder="Descreva como o problema foi resolvido..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 h-32 resize-none"
                    />
                    <button
                      onClick={handleResolverTicket}
                      disabled={isResolvendo || !solucao.trim()}
                      className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                    >
                      {isResolvendo ? 'Resolvendo...' : 'Resolver Ticket'}
                    </button>
                  </div>
                )}

                {/* Solução Existente */}
                {ticket.solucao && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Solução Aplicada:</label>
                    <div className="bg-gray-600/50 rounded-lg p-3">
                      <p className="text-white whitespace-pre-wrap">{ticket.solucao}</p>
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
