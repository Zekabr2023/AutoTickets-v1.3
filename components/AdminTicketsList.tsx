import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';

interface AdminTicketsListProps {
  onTicketSelect?: (ticket: Ticket) => void;
  tickets?: Ticket[];
  isLoading?: boolean;
}

export const AdminTicketsList: React.FC<AdminTicketsListProps> = ({
  onTicketSelect,
  tickets = [],
  isLoading = false
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('todos');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Reset page when tickets or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tickets, filtroStatus, filtroUrgencia, itemsPerPage]);

  const ticketsFiltrados = tickets.filter(ticket => {
    const statusMatch = filtroStatus === 'todos' || ticket.status === filtroStatus;
    const urgenciaMatch = filtroUrgencia === 'todos' || ticket.urgency === filtroUrgencia;
    return statusMatch && urgenciaMatch;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = ticketsFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ticketsFiltrados.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
        <div className="text-white text-center">Carregando tickets...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">🎫 Tickets do Sistema</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="Pending">Pendentes</option>
            <option value="InAnalysis">Em Análise</option>
            <option value="Resolved">Resolvidos</option>
            <option value="AwaitingInfo">Aguardando Informação</option>
            <option value="Archived">Arquivados</option>
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

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Ticket</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Empresa</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Solicitante</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Título</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Urgência</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Criado</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((ticket) => {
              const isNew = (new Date().getTime() - new Date(ticket.createdAt).getTime()) < (60 * 60 * 1000); // 1 hour
              return (
                <tr
                  key={ticket.id}
                  onClick={() => onTicketSelect?.(ticket)}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 cursor-pointer group ${isNew ? 'bg-indigo-500/10 hover:bg-indigo-500/20' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-400">#{String(ticket.numero).padStart(4, '0')}</span>
                      {isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-bold animate-pulse">
                          NOVO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {/* Exibe o nome da empresa vindo do banco */}
                    {ticket.empresaNome || 'Empresa desconhecida'}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {ticket.solicitanteNome || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-xs truncate" title={ticket.title}>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {ticketsFiltrados.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhum ticket encontrado com os filtros aplicados.
        </div>
      ) : (
        /* Pagination Controls */
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-t border-gray-700 pt-4">
          <div className="text-sm text-gray-400">
            Mostrando <span className="text-white font-medium">{indexOfFirstItem + 1}</span> a <span className="text-white font-medium">{Math.min(indexOfLastItem, ticketsFiltrados.length)}</span> de <span className="text-white font-medium">{ticketsFiltrados.length}</span> tickets
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Exibir:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <span className="flex items-center px-3 text-gray-300 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
