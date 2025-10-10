import React, { useState } from 'react';
import { Ticket, TicketStatus, UrgencyLevel } from '../types';

interface TicketListProps {
  title: string;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTicketDelete?: (ticketId: string) => void;
  deletingTicketIds?: string[];
}

const getUrgencyStyles = (urgency: UrgencyLevel) => {
    switch(urgency) {
        case UrgencyLevel.Critical: return 'border-red-500/50 text-red-400';
        case UrgencyLevel.High: return 'border-orange-500/50 text-orange-400';
        case UrgencyLevel.Medium: return 'border-yellow-500/50 text-yellow-400';
        case UrgencyLevel.Low: return 'border-sky-500/50 text-sky-400';
        default: return 'border-gray-500/50 text-gray-400';
    }
}

export const TicketList: React.FC<TicketListProps> = ({ title, tickets, onTicketClick, onTicketDelete, deletingTicketIds = [] }) => {
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [showDeleteButton, setShowDeleteButton] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (ticketId: string, ticketStatus: TicketStatus) => {
    // Não permite hover de deletar se o ticket estiver Resolvido
    if (ticketStatus === TicketStatus.Resolved) {
      return;
    }
    
    setHoveredTicketId(ticketId);
    
    // Limpar timeout anterior se existir
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Mostrar botão após 1.3 segundos
    const timeout = setTimeout(() => {
      setShowDeleteButton(ticketId);
    }, 1300);
    
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = (ticketId: string) => {
    setHoveredTicketId(null);
    setShowDeleteButton(null);
    
    // Limpar timeout se o mouse sair antes de 1.3s
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (onTicketDelete) {
      onTicketDelete(ticketId);
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">{title}</h2>
      {tickets.length === 0 ? (
        <p className="text-gray-400">Nenhum chamado encontrado.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isDeleting = deletingTicketIds?.includes(ticket.id) || false;
            
            return (
            <div
              key={ticket.id}
              onClick={() => onTicketClick(ticket)}
              onMouseEnter={() => handleMouseEnter(ticket.id, ticket.status)}
              onMouseLeave={() => handleMouseLeave(ticket.id)}
              className={`relative bg-gray-900/70 p-4 rounded-lg cursor-pointer hover:bg-gray-900/90 transition-all duration-300 border border-gray-700 hover:border-indigo-500 transform hover:-translate-y-1 ${
                isDeleting ? 'opacity-0 scale-95 -translate-x-8 pointer-events-none' : 'opacity-100 scale-100 translate-x-0'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-500/50">
                        #{String(ticket.numero).padStart(4, '0')}
                      </span>
                      <p className="font-semibold text-lg text-white">{ticket.title}</p>
                    </div>
                    <p className="text-sm text-gray-400">IA: {ticket.aiName} - Aberto em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === TicketStatus.Pending 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : ticket.status === TicketStatus.InAnalysis
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {ticket.status === TicketStatus.Pending 
                        ? 'Pendente' 
                        : ticket.status === TicketStatus.InAnalysis
                        ? 'Em Análise'
                        : 'Resolvido'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getUrgencyStyles(ticket.urgency)}`}>
                        {ticket.urgency}
                    </span>
                </div>
              </div>
              
              {/* Área de Exclusão com Degradê (30% lado direito) */}
              {showDeleteButton === ticket.id && (
                <div className="delete-gradient-enter absolute top-0 right-0 w-1/3 h-full bg-gradient-to-r from-transparent via-red-500/30 to-red-600/50 rounded-r-lg pointer-events-none" />
              )}
              
              {/* Botão de Excluir Centralizado na Área Vermelha */}
              {showDeleteButton === ticket.id && (
                <button
                  onClick={(e) => handleDeleteClick(e, ticket.id)}
                  className="delete-button-enter absolute top-1/2 right-[16.67%] transform -translate-y-1/2 bg-red-500/95 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-red-500/60 group border-2 border-red-300/70 backdrop-blur-sm"
                  title="Excluir chamado"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300">🗑️</span>
                </button>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
};
