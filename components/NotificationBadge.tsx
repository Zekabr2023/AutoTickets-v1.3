import React, { useState, useEffect } from 'react';
import { ticketService } from '../lib/ticketService';
import { TicketStatus } from '../types';

interface NotificationBadgeProps {
  empresaId?: string;
  isAdmin?: boolean;
  className?: string;
  forceHidden?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  empresaId,
  isAdmin = false,
  className = '',
  forceHidden = false
}) => {
  const [ticketsPendentes, setTicketsPendentes] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    carregarTicketsPendentes();

    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarTicketsPendentes, 30000);

    return () => clearInterval(interval);
  }, [empresaId, isAdmin]);

  const carregarTicketsPendentes = async () => {
    try {
      let pendentes = 0;

      if (isAdmin) {
        // Para admin, buscar todos os tickets pendentes
        const todosTickets = await ticketService.buscarTodosTickets();
        pendentes = todosTickets.filter(t => t.status === TicketStatus.Pending).length;
      } else if (empresaId) {
        // Para empresa específica
        const tickets = await ticketService.buscarTicketsPorStatus(empresaId, TicketStatus.Pending);
        pendentes = tickets.length;
      }

      setTicketsPendentes(pendentes);
      setIsVisible(pendentes > 0);
    } catch (error) {
      console.error('Erro ao carregar tickets pendentes:', error);
    }
  };

  if (!isVisible || ticketsPendentes === 0 || forceHidden) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse shadow-lg">
        {ticketsPendentes > 99 ? '99+' : ticketsPendentes}
      </div>
      <div className="absolute -top-1 -right-1 bg-red-400 rounded-full h-4 w-4 animate-ping opacity-75"></div>
    </div>
  );
};
