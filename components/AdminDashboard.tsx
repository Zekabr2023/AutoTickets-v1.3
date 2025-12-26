import React, { useState, useEffect } from 'react';
import { Empresa, authService } from '../lib/authService';
import { supabase } from '../lib/supabase';
import { TicketStatus, Ticket } from '../types';
import { PeriodFilter } from './PeriodFilter';
import { AdminCharts } from './AdminCharts';
import { AdminTicketsList } from './AdminTicketsList';
import { AdminKanbanBoard } from './AdminKanbanBoard';
import { AdminTicketModal } from './AdminTicketModal';
import { NotificationBadge } from './NotificationBadge';
import { NotificationBell } from './AdminNotifications';
import { SettingsModal } from './SettingsModal';
import { ColumnRuleModal } from './ColumnRuleModal';
import { BuildingIcon, RobotIcon, LogoutIcon, SearchIcon } from './icons';
import { useToast } from './ToastProvider';

interface AdminDashboardProps {
  empresa: Empresa;
  onLogout: () => void;
  initialTicketId?: string | null;
}

interface EstatisticasGerais {
  totalEmpresas: number;
  totalTickets: number;
  ticketsPendentes: number;
  ticketsEmAnalise: number;
  ticketsResolvidos: number;
  ticketsHoje: number;
}

interface EmpresaComTickets {
  id: string;
  nome_empresa: string;
  email_notificacao: string | null;
  whatsapp_notificacao: string | null;
  total_tickets: number;
  tickets_pendentes: number;
  tickets_em_analise: number;
  tickets_resolvidos: number;
  ultimo_login: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ empresa, onLogout, initialTicketId }) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais>({
    totalEmpresas: 0,
    totalTickets: 0,
    ticketsPendentes: 0,
    ticketsEmAnalise: 0,
    ticketsResolvidos: 0,
    ticketsHoje: 0,
  });
  const [empresas, setEmpresas] = useState<EmpresaComTickets[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [periodName, setPeriodName] = useState<string>('Todos');
  const [showNovaEmpresa, setShowNovaEmpresa] = useState(false);
  const [showNovaIA, setShowNovaIA] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'kanban'>('overview');
  const [showNovoSupervisor, setShowNovoSupervisor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Rules Config State
  const [systemConfig, setSystemConfig] = useState<any>({ templates: [] });
  const [columnRuleStatus, setColumnRuleStatus] = useState<TicketStatus | null>(null);
  const toast = useToast();

  // Deep Link Handler
  useEffect(() => {
    if (initialTicketId && tickets.length > 0 && !selectedTicket) {
      const linkedTicket = tickets.find(t => t.id === initialTicketId);
      if (linkedTicket) {
        console.log("🔗 Opening Deep Linked Ticket (Admin):", linkedTicket.numero);
        setSelectedTicket(linkedTicket);
      }
    }
  }, [initialTicketId, tickets]);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch system config on mount
  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setSystemConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };




  const carregarDados = async (silent = false) => {
    try {
      console.log('🔄 Iniciando carregamento de dados do admin...');

      // ... existing fetch logic for companies ...
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome_empresa, ultimo_login, email_notificacao, whatsapp_notificacao, notificacoes_ativas, is_admin, criado_em, atualizado_em');

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError);
        throw empresasError;
      }

      console.log(`✅ ${empresasData?.length || 0} empresas carregadas.`);

      // Buscar tickets com filtro de data se aplicável
      let ticketsQuery = supabase
        .from('tickets')
        .select(`
          *,
          empresas(nome_empresa)
        `) // Usando nome da tabela de relação
        .order('criado_em', { ascending: false });

      if (startDate && endDate) {
        ticketsQuery = ticketsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: ticketsData, error: ticketsError } = await ticketsQuery;

      if (ticketsError) {
        console.error('❌ Erro ao buscar tickets:', ticketsError);
        throw ticketsError;
      }

      console.log(`✅ ${ticketsData?.length || 0} tickets carregados.`);

      // Process tickets to include company name flatly if needed, or just use the joined data
      // Process tickets to include company name flatly if needed, or just use the joined data
      const processedTickets: Ticket[] = ticketsData?.map((t: any) => ({
        id: t.id,
        numero: t.numero,
        title: t.titulo, // Correct: DB is 'titulo'
        description: t.descricao, // Correct: DB is 'descricao'
        whatShouldHappen: t.o_que_deveria_acontecer, // Correct: DB is 'o_que_deveria_acontecer'
        aiId: t.ai_id,
        aiName: t.ai_name,
        status: t.status as TicketStatus,
        createdAt: t.criado_em, // Correct: DB is 'criado_em'

        attachments: t.imagens || [], // Correct: DB is 'imagens'
        urgency: t.urgencia, // Correct: DB is 'urgencia'

        solucao: t.solucao,
        resolvidoPor: t.resolvido_por,
        resolvidoEm: t.resolvido_em,
        solicitacaoInfo: t.solicitacao_info,
        respostaCliente: t.resposta_cliente, // Added missing field

        chatHistory: t.chat_history || [],

        attachmentsSolution: t.imagens_solucao || [], // Correct: DB is 'imagens_solucao'

        solicitanteNome: t.solicitante_nome, // Requester name from DB
        empresaNome: t.empresas?.nome_empresa // Helper for display
      })) || [];

      setTickets(processedTickets); // Save to state

      // ... existing stats calculation ...
      const totalTickets = processedTickets.length;
      const ticketsPendentes = processedTickets.filter(t => t.status === 'Pending').length;
      const ticketsEmAnalise = processedTickets.filter(t => t.status === 'InAnalysis').length;
      const ticketsResolvidos = processedTickets.filter(t => t.status === 'Resolved').length;

      // ... 


      // Tickets de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const ticketsHoje = ticketsData?.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= hoje && ticketDate < amanha;
      }).length || 0;

      setEstatisticas({
        totalEmpresas: empresasData?.length || 0,
        totalTickets,
        ticketsPendentes,
        ticketsEmAnalise,
        ticketsResolvidos,
        ticketsHoje,
      });

      // Calcular estatísticas por empresa
      const empresasComTickets = empresasData?.map(empresa => {
        const ticketsEmpresa = ticketsData?.filter(t => t.empresa_id === empresa.id) || [];

        return {
          id: empresa.id,
          nome_empresa: empresa.nome_empresa,
          email_notificacao: empresa.email_notificacao,
          whatsapp_notificacao: empresa.whatsapp_notificacao,
          total_tickets: ticketsEmpresa.length,
          tickets_pendentes: ticketsEmpresa.filter(t => t.status === 'Pending').length,
          tickets_em_analise: ticketsEmpresa.filter(t => t.status === 'InAnalysis').length,
          tickets_resolvidos: ticketsEmpresa.filter(t => t.status === 'Resolved').length,
          ultimo_login: empresa.ultimo_login,
        };
      }) || [];

      setEmpresas(empresasComTickets);

    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
      if (!silent) toast.error('Erro ao carregar dados. Verifique o console.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('admin_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        carregarDados(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => {
        carregarDados(true);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleNovaEmpresa = async (dadosEmpresa: {
    nome_empresa: string;
    email_notificacao?: string;
    whatsapp_notificacao?: string;
    ias: string[];
  }) => {
    try {
      // Criar empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .insert([{
          nome_empresa: dadosEmpresa.nome_empresa,
          senha: 'Suporteautomabo',
          email_notificacao: dadosEmpresa.email_notificacao || null,
          whatsapp_notificacao: dadosEmpresa.whatsapp_notificacao || null,
          notificacoes_ativas: false,
          is_admin: false,
        }])
        .select('id, nome_empresa, ultimo_login, email_notificacao, whatsapp_notificacao, notificacoes_ativas, is_admin, criado_em, atualizado_em')
        .single();

      if (empresaError) throw empresaError;

      // Criar IAs para a empresa
      if (dadosEmpresa.ias.length > 0) {
        const iasData = dadosEmpresa.ias.map(ia => ({
          nome: ia,
          empresa_id: empresaData.id,
        }));

        const { error: iasError } = await supabase
          .from('ias')
          .insert(iasData);

        if (iasError) throw iasError;
      }

      toast.success('Empresa e IAs cadastrados com sucesso!');
      setShowNovaEmpresa(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      toast.error('Erro ao cadastrar empresa. Veja o console para detalhes.');
    }
  };

  const handleNovaIA = async (dadosIA: { nome: string; empresa_id: string }) => {
    try {
      const { error } = await supabase
        .from('ias')
        .insert([{
          nome: dadosIA.nome,
          empresa_id: dadosIA.empresa_id,
        }]);

      if (error) throw error;

      toast.success('IA cadastrada com sucesso!');
      setShowNovaIA(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar IA:', error);
      toast.error('Erro ao criar IA: ' + error.message);
    }
  };

  const handleNovoSupervisor = async (dados: { nome: string; senha: string }) => {
    try {
      const { success, error } = await authService.criarEmpresa(dados.nome, dados.senha, true);

      if (success) {
        toast.success('Supervisor criado com sucesso!');
        setShowNovoSupervisor(false);
        carregarDados(true);
      } else {
        toast.error('Erro ao criar supervisor: ' + error);
      }
    } catch (error: any) {
      console.error('Erro ao criar supervisor:', error);
      toast.error('Erro ao criar supervisor: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados administrativos...</div>
      </div>
    );
  }

  // Filter tickets for display
  const filteredTickets = tickets.filter(ticket => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const matchesNumber = String(ticket.numero).includes(searchTerm);
    const matchesTitle = ticket.title.toLowerCase().includes(searchLower);
    const matchesCompany = ticket.empresaNome?.toLowerCase().includes(searchLower);
    return matchesNumber || matchesTitle || matchesCompany;
  });

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🔧 Painel Administrativo</h1>
          <p className="text-gray-300">Gerencie empresas, IAs e monitore o sistema</p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3">
          {/* Busca Colapsada */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${showSearch ? 'w-64' : 'w-auto'}`}>
            {showSearch && (
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ticket..."
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 animate-fade-in"
                autoFocus
              />
            )}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchTerm('');
              }}
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
            onClick={() => setShowNovaEmpresa(true)}
            className="group relative font-semibold py-2 px-3 rounded-lg border bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
            title="Nova Empresa"
          >
            <BuildingIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
              Nova Empresa
            </span>
          </button>

          <button
            onClick={() => setShowNovaIA(true)}
            className="group relative font-semibold py-2 px-3 rounded-lg border bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
            title="Nova IA"
          >
            <RobotIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
              Nova IA
            </span>
          </button>

          {empresa.nome_empresa === 'AUTOMABO' && (
            <>
              <button
                onClick={() => setShowNovoSupervisor(true)}
                className="group relative font-semibold py-2 px-3 rounded-lg border bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
                title="Novo Supervisor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
                  Novo Supervisor
                </span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="group relative font-semibold py-2 px-3 rounded-lg border bg-indigo-600/30 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/50 hover:border-indigo-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
                title="Configurações (Sistema)"
              >
                <span className="text-xl">⚙️</span>
                <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
                  Configurações
                </span>
              </button>
            </>
          )}

          <NotificationBell
            className="mx-2"
            onNotificationClick={(ticketId) => {
              const ticket = tickets.find(t => t.id === ticketId);
              if (ticket) {
                setSelectedTicket(ticket);
              } else {
                carregarDados(true);
                console.log('Ticket notification clicked:', ticketId);
              }
            }}
          />

          <button
            onClick={onLogout}
            className="group relative font-semibold py-2 px-3 rounded-lg border bg-red-600/20 text-red-300 border-red-600/50 hover:bg-red-600/30 hover:border-red-600 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
            title="Sair"
          >
            <LogoutIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
              Sair
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Abas de Navegação Redesenhadas */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-800/50 p-1.5 rounded-2xl border border-gray-700/50 shadow-inner backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Visão Geral', icon: '📊' },
                { id: 'tickets', label: 'Tickets', icon: '🎫', badge: true },
                { id: 'kanban', label: 'Kanban', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                  {tab.badge && <NotificationBadge isAdmin={true} className="ml-2 bg-red-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'overview' && (
          <>

            {/* Estatísticas Gerais (MOVED UP) - Using StatCard Component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8 animate-fade-in-up">
              <StatCard
                title="Total Empresas"
                value={estatisticas.totalEmpresas}
                icon="🏢"
                color="blue"
              />
              <StatCard
                title="Total Tickets"
                value={estatisticas.totalTickets}
                icon="📋"
                color="gray"
              />
              <StatCard
                title="Pendentes"
                value={estatisticas.ticketsPendentes}
                icon="⏳"
                color="yellow"
              />
              <StatCard
                title="Em Análise"
                value={estatisticas.ticketsEmAnalise}
                icon="🔍"
                color="indigo"
              />
              <StatCard
                title="Resolvidos"
                value={estatisticas.ticketsResolvidos}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Hoje"
                value={estatisticas.ticketsHoje}
                icon="📅"
                color="purple"
              />
            </div>

            {/* Gráficos (MOVED DOWN) */}
            <div className="animate-fade-in-up delay-100 mb-8">
              <AdminCharts
                stats={{
                  totalEmpresas: estatisticas.totalEmpresas,
                  totalTickets: estatisticas.totalTickets,
                  ticketsPendentes: estatisticas.ticketsPendentes,
                  ticketsEmAnalise: estatisticas.ticketsEmAnalise,
                  ticketsResolvidos: estatisticas.ticketsResolvidos,
                  ticketsHoje: estatisticas.ticketsHoje,
                }}
                empresas={empresas.map(emp => ({
                  id: emp.id,
                  nome: emp.nome_empresa,
                  tickets_pendentes: emp.tickets_pendentes,
                  tickets_em_analise: emp.tickets_em_analise,
                  tickets_resolvidos: emp.tickets_resolvidos,
                }))}
                tickets={filteredTickets}
              />
            </div>

            {/* Lista de Empresas */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">🏢 Empresas Cadastradas</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Empresa</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Total</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Pendentes</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Em Análise</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Resolvidos</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Último Login</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Notificações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
                      <tr key={empresa.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors duration-200">
                        <td className="py-3 px-4 text-white font-medium">{empresa.nome_empresa}</td>
                        <td className="py-3 px-4 text-gray-300">{empresa.total_tickets}</td>
                        <td className="py-3 px-4 text-yellow-400">{empresa.tickets_pendentes}</td>
                        <td className="py-3 px-4 text-blue-400">{empresa.tickets_em_analise}</td>
                        <td className="py-3 px-4 text-green-400">{empresa.tickets_resolvidos}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {empresa.ultimo_login
                            ? new Date(empresa.ultimo_login).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {empresa.email_notificacao && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                📧
                              </span>
                            )}
                            {empresa.whatsapp_notificacao && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                                📱
                              </span>
                            )}
                            {!empresa.email_notificacao && !empresa.whatsapp_notificacao && (
                              <span className="text-gray-500 text-xs">Nenhuma</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tickets Tab - Only List */}
        {
          activeTab === 'tickets' && (
            <AdminTicketsList
              onTicketSelect={setSelectedTicket}
              tickets={filteredTickets}
              isLoading={isLoading}
            />
          )
        }

        {/* Kanban Tab */}
        {
          activeTab === 'kanban' && (
            <AdminKanbanBoard
              tickets={filteredTickets}
              isLoading={isLoading}
              onTicketSelect={setSelectedTicket}
              onTicketUpdated={() => carregarDados(true)}
              rules={systemConfig.templates}
              onEditRules={(status) => setColumnRuleStatus(status)}
            />
          )
        }
      </main >

      {/* Modal Nova Empresa */}
      {
        showNovaEmpresa && (
          <NovaEmpresaModal
            onClose={() => setShowNovaEmpresa(false)}
            onSave={handleNovaEmpresa}
          />
        )
      }

      {/* Modal Nova IA */}
      {
        showNovaIA && (
          <NovaIAModal
            empresas={empresas}
            onClose={() => setShowNovaIA(false)}
            onSave={handleNovaIA}
          />
        )
      }

      {/* Modal Settings */}
      {
        showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
          />
        )
      }

      {/* Modal Regras da Coluna (Kanban) */}
      {
        columnRuleStatus && (
          <ColumnRuleModal
            status={columnRuleStatus}
            onClose={() => setColumnRuleStatus(null)}
            onSaveSuccess={() => {
              fetchSystemConfig();
            }}
          />
        )
      }

      {/* Modal Novo Supervisor */}

      {/* Modal Visualizar Ticket */}
      {
        selectedTicket && (
          <AdminTicketModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onTicketUpdated={() => carregarDados(true)}
            adminName={empresa.nome_empresa}
          />
        )
      }

      {/* Modal Novo Supervisor */}
      {
        showNovoSupervisor && (
          <NovaSupervisorModal
            onClose={() => setShowNovoSupervisor(false)}
            onSave={handleNovoSupervisor}
          />
        )
      }
    </div >
  );
};

// Modal Nova Empresa
const NovaEmpresaModal: React.FC<{
  onClose: () => void;
  onSave: (dados: {
    nome_empresa: string;
    email_notificacao?: string;
    whatsapp_notificacao?: string;
    ias: string[];
  }) => void;
}> = ({ onClose, onSave }) => {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [emailNotificacao, setEmailNotificacao] = useState('');
  const [whatsappNotificacao, setWhatsappNotificacao] = useState('');
  const [ias, setIas] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa.trim()) return;

    const iasValidas = ias.filter(ia => ia.trim());

    onSave({
      nome_empresa: nomeEmpresa.trim(),
      email_notificacao: emailNotificacao.trim() || undefined,
      whatsapp_notificacao: whatsappNotificacao.trim() || undefined,
      ias: iasValidas,
    });
  };

  const adicionarIA = () => {
    setIas([...ias, '']);
  };

  const removerIA = (index: number) => {
    setIas(ias.filter((_, i) => i !== index));
  };

  const atualizarIA = (index: number, valor: string) => {
    const novasIAs = [...ias];
    novasIAs[index] = valor;
    setIas(novasIAs);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4">🏢 Nova Empresa</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nome da Empresa</label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Email para Notificações (opcional)</label>
            <input
              type="email"
              value={emailNotificacao}
              onChange={(e) => setEmailNotificacao(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">WhatsApp para Notificações (opcional)</label>
            <input
              type="text"
              value={whatsappNotificacao}
              onChange={(e) => setWhatsappNotificacao(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">IAs da Empresa</label>
            {ias.map((ia, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ia}
                  onChange={(e) => atualizarIA(index, e.target.value)}
                  placeholder={`Nome da IA ${index + 1} `}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
                {ias.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerIA(index)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarIA}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              + Adicionar IA
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Nova IA
const NovaIAModal: React.FC<{
  empresas: EmpresaComTickets[];
  onClose: () => void;
  onSave: (dados: { nome: string; empresa_id: string }) => void;
}> = ({ empresas, onClose, onSave }) => {
  const [nomeIA, setNomeIA] = useState('');
  const [empresaId, setEmpresaId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeIA.trim() || !empresaId) return;

    onSave({
      nome: nomeIA.trim(),
      empresa_id: empresaId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4">🤖 Nova IA</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nome da IA</label>
            <input
              type="text"
              value={nomeIA}
              onChange={(e) => setNomeIA(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Empresa</label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// Helper Component for Stats
const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => {
  const getColorClasses = (c: string) => {
    const map: any = {
      blue: 'from-blue-500/20 to-blue-600/30 border-blue-500/30 text-blue-200',
      gray: 'from-gray-500/20 to-gray-600/30 border-gray-500/30 text-gray-200',
      yellow: 'from-yellow-500/20 to-yellow-600/30 border-yellow-500/30 text-yellow-200',
      indigo: 'from-indigo-500/20 to-indigo-600/30 border-indigo-500/30 text-indigo-200',
      green: 'from-green-500/20 to-green-600/30 border-green-500/30 text-green-200',
      purple: 'from-purple-500/20 to-purple-600/30 border-purple-500/30 text-purple-200',
    };
    return map[c] || map['gray'];
  };

  const classes = getColorClasses(color);

  return (
    <div className={`bg-gradient-to-br ${classes} backdrop-blur-sm rounded-xl p-6 border transition-transform hover:scale-105 duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium opacity-80 mb-1`}>{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};


// Modal Novo Supervisor
const NovaSupervisorModal: React.FC<{
  onClose: () => void;
  onSave: (dados: { nome: string; senha: string }) => void;
}> = ({ onClose, onSave }) => {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !senha.trim()) return;
    onSave({ nome: nome.trim(), senha: senha.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4">👤 Novo Supervisor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};