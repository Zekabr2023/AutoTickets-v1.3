import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { TicketList } from './TicketList';
import { TicketDetailsModal } from './TicketDetailsModal';
import { ClientSettingsModal } from './ClientSettingsModal';
import { NotificationBadge } from './NotificationBadge';
import { BellIcon, SearchIcon } from './icons';
import { Empresa } from '../lib/authService';
import { ticketService } from '../lib/ticketService';
import { useToast } from './ToastProvider';

interface DashboardProps {
  empresa: Empresa;
  onOpenNewTicket: () => void;
  onLogout: () => void;
  onEmpresaUpdate: (empresa: Empresa) => void;
  initialTicketId?: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ empresa, onOpenNewTicket, onLogout, onEmpresaUpdate, initialTicketId }) => {
  const toast = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientSettings, setShowClientSettings] = useState(false);
  const [searchNumero, setSearchNumero] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<Ticket | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [deletingTicketIds, setDeletingTicketIds] = useState<string[]>([]);
  const [notificationsHidden, setNotificationsHidden] = useState(false);

  // Deep Link handler
  useEffect(() => {
    if (initialTicketId && tickets.length > 0 && !selectedTicket) {
      const linkedTicket = tickets.find(t => t.id === initialTicketId);
      if (linkedTicket) {
        console.log("🔗 Opening Deep Linked Ticket (Client):", linkedTicket.numero);
        setSelectedTicket(linkedTicket);
        // Clear localStorage after successfully opening
        localStorage.removeItem('pendingTicketId');
      } else {
        console.warn("⚠️ Deep Link ticket not found or not owned by this company:", initialTicketId);
        toast.warning("O ticket solicitado não foi encontrado ou não pertence à sua empresa.");
        localStorage.removeItem('pendingTicketId');
      }
    }
  }, [initialTicketId, tickets]);

  // Carregar tickets ao montar o componente
  const carregarTickets = async () => {
    setIsLoading(true);
    const ticketsCarregados = await ticketService.buscarTickets(empresa.id);
    setTickets(ticketsCarregados);
    setIsLoading(false);
  };

  useEffect(() => {
    carregarTickets();
  }, [empresa.id]);

  useEffect(() => {
    const subscription = ticketService.inscreverAtualizacoes(empresa.id, (payload) => {
      console.log('Atualização em tempo real:', payload);
      ticketService.buscarTickets(empresa.id).then(setTickets);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [empresa.id]);

  const pendingTickets = tickets.filter(t => t.status === TicketStatus.Pending || t.status === TicketStatus.AwaitingInfo);
  const inAnalysisTickets = tickets.filter(t => t.status === TicketStatus.InAnalysis);
  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.Resolved);

  const totalTickets = tickets.length;
  // const pendingCount = pendingTickets.length; // unused var removed
  const pendingOrWaitingCount = pendingTickets.length;
  const inAnalysisCount = inAnalysisTickets.length;
  const resolvedCount = resolvedTickets.length;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 100;

  const handleSearch = async () => {
    if (!searchNumero.trim()) {
      setSearchedTicket(null);
      return;
    }

    const numero = parseInt(searchNumero);
    if (isNaN(numero)) {
      toast.warning('Digite um número válido');
      return;
    }

    const ticket = await ticketService.buscarTicketPorNumero(empresa.id, numero);
    if (ticket) {
      setSearchedTicket(ticket);
      setSelectedTicket(ticket);
    } else {
      toast.error(`Ticket #${searchNumero} não encontrado`);
      setSearchedTicket(null);
    }
  };

  const handleClearSearch = () => {
    setSearchNumero('');
    setSearchedTicket(null);
    setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchNumero('');
      setSearchedTicket(null);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('ATENÇÃO: Tem certeza que deseja deletar este ticket? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingTicketIds(prev => [...prev, ticketId]);

      // Simular delay da animação
      await new Promise(resolve => setTimeout(resolve, 500));

      // Otmista
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setDeletingTicketIds(prev => prev.filter(id => id !== ticketId));

      const result = await ticketService.deletarTicket(ticketId);

      if (!result.success) {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error('❌ Exceção ao deletar ticket:', error);
      const ticketsRestaurados = await ticketService.buscarTickets(empresa.id);
      setTickets(ticketsRestaurados);
      setDeletingTicketIds([]);
      toast.error(`Erro ao deletar chamado: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Painel de Suporte</h1>
          <p className="text-gray-400 text-sm mt-1">Bem-vindo, {empresa.nome_empresa}</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Busca Colapsada */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${showSearch ? 'w-64' : 'w-auto'}`}>
            {showSearch && (
              <input
                type="text"
                value={searchNumero}
                onChange={(e) => setSearchNumero(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar #número..."
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 animate-fade-in"
                autoFocus
              />
            )}
            {showSearch && searchNumero && (
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                title="Buscar"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleSearch}
              className="group relative font-semibold py-2 px-3 rounded-lg border bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
              title="Buscar Ticket"
            >
              <SearchIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
                {showSearch ? 'Fechar' : 'Buscar'}
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setShowClientSettings(true);
              setNotificationsHidden(true);
            }}
            className={`group relative font-semibold py-2 px-3 rounded-lg border transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden ${empresa.email_notificacao || empresa.whatsapp_notificacao
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30 hover:border-yellow-500'
              : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              }`}
            title="Minhas Preferências"
          >
            <div className="relative">
              <BellIcon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${empresa.email_notificacao || empresa.whatsapp_notificacao
                ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : ''
                }`} />
              <NotificationBadge empresaId={empresa.id} className="absolute -top-1 -right-1" forceHidden={notificationsHidden} />
            </div>
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
              Preferências
            </span>
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600/20 text-red-300 font-semibold py-2 px-4 rounded-lg border border-red-600/50 hover:bg-red-600/30 hover:border-red-600 transition-all duration-300"
          >
            Sair
          </button>
          <button
            onClick={onOpenNewTicket}
            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
          >
            Abrir Chamado
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Resultado da Busca */}
        {searchedTicket && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
            <div className="flex justify-between items-center">
              <p className="text-green-300 font-semibold">
                ✅ Ticket #{String(searchedTicket.numero).padStart(4, '0')} encontrado! Clique nele para ver detalhes.
              </p>
              <button
                onClick={handleClearSearch}
                className="bg-green-600/30 text-green-200 px-3 py-1 rounded-lg hover:bg-green-600/50 transition text-sm"
              >
                Limpar Busca
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Resumo da Operação</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/70 p-4 rounded-lg text-center border border-gray-700">
              <p className="text-4xl font-extrabold text-yellow-400">{pendingOrWaitingCount}</p>
              <p className="text-sm text-gray-400 mt-1">Pendentes</p>
            </div>
            <div className="bg-gray-900/70 p-4 rounded-lg text-center border border-gray-700">
              <p className="text-4xl font-extrabold text-blue-400">{inAnalysisCount}</p>
              <p className="text-sm text-gray-400 mt-1">Em Análise</p>
            </div>
            <div className="bg-gray-900/70 p-4 rounded-lg text-center border border-gray-700">
              <p className="text-4xl font-extrabold text-green-400">{resolvedCount}</p>
              <p className="text-sm text-gray-400 mt-1">Resolvidos</p>
            </div>
            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-300">Taxa de Resolução</p>
                <p className="text-lg font-bold text-indigo-400">{resolutionRate}%</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${resolutionRate}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">Nossa meta é a sua tranquilidade.</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-white">Carregando tickets...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TicketList
              title="Pendentes"
              tickets={pendingTickets}
              onTicketClick={setSelectedTicket}
              onTicketDelete={handleDeleteTicket}
              deletingTicketIds={deletingTicketIds}
            />
            <TicketList
              title="Em Análise"
              tickets={inAnalysisTickets}
              onTicketClick={setSelectedTicket}
              onTicketDelete={handleDeleteTicket}
              deletingTicketIds={deletingTicketIds}
            />
            <TicketList
              title="Resolvidos"
              tickets={resolvedTickets}
              onTicketClick={setSelectedTicket}
              onTicketDelete={handleDeleteTicket}
              deletingTicketIds={deletingTicketIds}
            />
          </div>
        )}
      </main>

      {/* Modal Visualizar Ticket */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onDelete={handleDeleteTicket}
          onTicketUpdated={carregarTickets}
        />
      )}

      {/* Modal Preferências do Cliente */}
      {showClientSettings && (
        <ClientSettingsModal
          empresa={empresa}
          onClose={() => setShowClientSettings(false)}
          onUpdate={onEmpresaUpdate}
        />
      )}
    </div>
  );
};
