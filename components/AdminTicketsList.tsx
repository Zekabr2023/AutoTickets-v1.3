import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { ticketService } from '../lib/ticketService';
import { supabase } from '../lib/supabase';

interface AdminTicketsListProps {
  onTicketSelect?: (ticket: Ticket) => void;
}

export const AdminTicketsList: React.FC<AdminTicketsListProps> = ({ onTicketSelect }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('todos');

  useEffect(() => {
    carregarTickets();
  }, []);

  const carregarTickets = async () => {
    try {
      setIsLoading(true);
      const todosTickets = await ticketService.buscarTodosTickets();
      setTickets(todosTickets);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ticketsFiltrados = tickets.filter(ticket => {
    const statusMatch = filtroStatus === 'todos' || ticket.status === filtroStatus;
    const urgenciaMatch = filtroUrgencia === 'todos' || ticket.urgency === filtroUrgencia;
    return statusMatch && urgenciaMatch;
  });

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

  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
        <div className="text-white text-center">Carregando tickets...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🎫 Tickets do Sistema</h2>
        <div className="flex gap-4">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="Pending">Pendentes</option>
            <option value="InAnalysis">Em Análise</option>
            <option value="Resolved">Resolvidos</option>
          </select>
          
          <select
            value={filtroUrgencia}
            onChange={(e) => setFiltroUrgencia(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="todos">Todas as Urgências</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Ticket</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Empresa</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Título</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Urgência</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Criado</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors duration-200">
                <td className="py-3 px-4 text-white font-medium">
                  #{String(ticket.numero).padStart(4, '0')}
                </td>
                <td className="py-3 px-4 text-gray-300">
                  {/* Aqui precisaríamos buscar o nome da empresa */}
                  Empresa
                </td>
                <td className="py-3 px-4 text-gray-300 max-w-xs truncate">
                  {ticket.title}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(ticket.urgency)}`}>
                    {ticket.urgency}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onTicketSelect?.(ticket)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ticketsFiltrados.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Nenhum ticket encontrado com os filtros aplicados.
        </div>
      )}
    </div>
  );
};
