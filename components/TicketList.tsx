import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, UrgencyLevel } from '../types';

interface TicketListProps {
  title: string;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTicketDelete?: (ticketId: string) => void;
  deletingTicketIds?: string[];
}

const getUrgencyStyles = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case UrgencyLevel.Critical: return 'border-red-500/50 text-red-400';
    case UrgencyLevel.High: return 'border-orange-500/50 text-orange-400';
    case UrgencyLevel.Medium: return 'border-yellow-500/50 text-yellow-400';
    case UrgencyLevel.Low: return 'border-sky-500/50 text-sky-400';
    default: return 'border-gray-500/50 text-gray-400';
  }
}

// Calculate countdown for tacit acceptance
const getCountdown = (ticket: Ticket): { formatted: string; isUrgent: boolean } | null => {
  if (ticket.status !== TicketStatus.AwaitingInfo) return null;

  // Determine start time with fallbacks
  let startTime: number;

  if (ticket.aguardandoInfoDesde) {
    startTime = new Date(ticket.aguardandoInfoDesde).getTime();
  } else if (ticket.chatHistory && ticket.chatHistory.length > 0) {
    const lastAdminMessage = [...ticket.chatHistory].reverse().find(msg => msg.sender === 'Admin');
    startTime = lastAdminMessage
      ? new Date(lastAdminMessage.timestamp).getTime()
      : new Date(ticket.createdAt).getTime();
  } else {
    startTime = new Date(ticket.createdAt).getTime();
  }

  const deadline = startTime + (48 * 60 * 60 * 1000);
  const remaining = deadline - Date.now();

  if (remaining <= 0) {
    return { formatted: 'EXPIRADO', isUrgent: true };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return { formatted, isUrgent: hours < 6 };
};

export const TicketList: React.FC<TicketListProps> = ({ title, tickets, onTicketClick, onTicketDelete, deletingTicketIds = [] }) => {
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [showDeleteButton, setShowDeleteButton] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [, setTick] = useState(0);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseEnter = (ticketId: string, ticketStatus: TicketStatus) => {
    if (ticketStatus === TicketStatus.Resolved) {
      return;
    }

    setHoveredTicketId(ticketId);

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const timeout = setTimeout(() => {
      setShowDeleteButton(ticketId);
    }, 1300);

    setHoverTimeout(timeout);
  };

  const handleMouseLeave = (ticketId: string) => {
    setHoveredTicketId(null);
    setShowDeleteButton(null);

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
            const countdown = getCountdown(ticket);

            return (
              <div
                key={ticket.id}
                onClick={() => onTicketClick(ticket)}
                onMouseEnter={() => handleMouseEnter(ticket.id, ticket.status)}
                onMouseLeave={() => handleMouseLeave(ticket.id)}
                className={`relative p-4 rounded-lg cursor-pointer hover:bg-gray-900/90 transition-all duration-300 border transform hover:-translate-y-1 ${isDeleting ? 'opacity-0 scale-95 -translate-x-8 pointer-events-none' : 'opacity-100 scale-100 translate-x-0'
                  } ${ticket.status === TicketStatus.AwaitingInfo
                    ? 'bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-400'
                    : 'bg-gray-900/70 border-gray-700 hover:border-indigo-500'
                  }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-500/50">
                        #{String(ticket.numero).padStart(4, '0')}
                      </span>
                      <p className={`font-semibold text-lg ${ticket.status === TicketStatus.AwaitingInfo ? 'text-yellow-200' : 'text-white'
                        }`}>{ticket.title}</p>
                    </div>
                    <p className="text-sm text-gray-400">IA: {ticket.aiName} - Aberto em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</p>

                    {/* Countdown for AwaitingInfo */}
                    {countdown && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${countdown.isUrgent
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        }`}>
                        <span>⏱️</span>
                        <span>{countdown.formatted}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${ticket.status === TicketStatus.Pending
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : ticket.status === TicketStatus.InAnalysis
                          ? 'bg-blue-500/20 text-blue-300'
                          : ticket.status === TicketStatus.AwaitingInfo
                            ? 'bg-yellow-500 text-black border border-yellow-400 animate-pulse'
                            : 'bg-green-500/20 text-green-300'
                        }`}
                    >
                      {ticket.status === TicketStatus.Pending
                        ? 'Pendente'
                        : ticket.status === TicketStatus.InAnalysis
                          ? 'Em Análise'
                          : ticket.status === TicketStatus.AwaitingInfo
                            ? 'Aguardando Informação'
                            : 'Resolvido'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getUrgencyStyles(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                  </div>
                </div>

                {/* Área de Exclusão */}
                {showDeleteButton === ticket.id && (
                  <div className="delete-gradient-enter absolute top-0 right-0 w-1/3 h-full bg-gradient-to-r from-transparent via-red-500/30 to-red-600/50 rounded-r-lg pointer-events-none" />
                )}

                {/* Botão de Excluir */}
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
            )
          })}
        </div>
      )}
    </div>
  );
};
