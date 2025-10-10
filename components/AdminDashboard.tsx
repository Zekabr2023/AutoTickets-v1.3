import React, { useState, useEffect } from 'react';
import { Empresa } from '../lib/authService';
import { supabase } from '../lib/supabase';
import { TicketStatus } from '../types';
import { PeriodFilter } from './PeriodFilter';
import { AdminCharts } from './AdminCharts';
import { BuildingIcon, RobotIcon, LogoutIcon } from './icons';

interface AdminDashboardProps {
  empresa: Empresa;
  onLogout: () => void;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ empresa, onLogout }) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais>({
    totalEmpresas: 0,
    totalTickets: 0,
    ticketsPendentes: 0,
    ticketsEmAnalise: 0,
    ticketsResolvidos: 0,
    ticketsHoje: 0,
  });
  const [empresas, setEmpresas] = useState<EmpresaComTickets[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [periodName, setPeriodName] = useState<string>('Todos');
  const [showNovaEmpresa, setShowNovaEmpresa] = useState(false);
  const [showNovaIA, setShowNovaIA] = useState(false);

  // Carregar estatísticas gerais
  useEffect(() => {
    carregarDados();
  }, [startDate, endDate]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);

      // Buscar todas as empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('*');

      if (empresasError) throw empresasError;

      // Buscar tickets com filtro de data se aplicável
      let ticketsQuery = supabase.from('tickets').select('*');
      
      if (startDate && endDate) {
        ticketsQuery = ticketsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: ticketsData, error: ticketsError } = await ticketsQuery;

      if (ticketsError) throw ticketsError;

      // Calcular estatísticas
      const totalTickets = ticketsData?.length || 0;
      const ticketsPendentes = ticketsData?.filter(t => t.status === 'Pending').length || 0;
      const ticketsEmAnalise = ticketsData?.filter(t => t.status === 'InAnalysis').length || 0;
      const ticketsResolvidos = ticketsData?.filter(t => t.status === 'Resolved').length || 0;
      
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
    } finally {
      setIsLoading(false);
    }
  };

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
        .select()
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

      alert('Empresa e IAs cadastrados com sucesso!');
      setShowNovaEmpresa(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      alert('Erro ao cadastrar empresa. Veja o console para detalhes.');
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

      alert('IA cadastrada com sucesso!');
      setShowNovaIA(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao cadastrar IA:', error);
      alert('Erro ao cadastrar IA. Veja o console para detalhes.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados administrativos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🔧 Painel Administrativo</h1>
          <p className="text-gray-300">Gerencie empresas, IAs e monitore o sistema</p>
        </div>
        
        {/* Botões de Ação */}
        <div className="flex items-center gap-3">
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
        {/* Filtro de Período */}
        <div className="mb-6 flex justify-end">
          <PeriodFilter onPeriodChange={(start, end, name) => {
            setStartDate(start);
            setEndDate(end);
            setPeriodName(name);
          }} />
        </div>

        {/* Indicador de Período */}
        {periodName !== 'Todos' && (
          <div className="mb-4 p-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg backdrop-blur-sm">
            <p className="text-indigo-300 text-sm font-medium">
              📅 Filtrando por: <span className="text-indigo-200 font-semibold">{periodName}</span>
            </p>
          </div>
        )}

        {/* Gráficos */}
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
        />

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Empresas</p>
                <p className="text-3xl font-bold text-white">{estatisticas.totalEmpresas}</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/30 backdrop-blur-sm rounded-xl p-6 border border-gray-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm font-medium">Total Tickets</p>
                <p className="text-3xl font-bold text-white">{estatisticas.totalTickets}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-medium">Pendentes</p>
                <p className="text-3xl font-bold text-white">{estatisticas.ticketsPendentes}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm font-medium">Em Análise</p>
                <p className="text-3xl font-bold text-white">{estatisticas.ticketsEmAnalise}</p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Resolvidos</p>
                <p className="text-3xl font-bold text-white">{estatisticas.ticketsResolvidos}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Hoje</p>
                <p className="text-3xl font-bold text-white">{estatisticas.ticketsHoje}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>
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
      </main>

      {/* Modal Nova Empresa */}
      {showNovaEmpresa && (
        <NovaEmpresaModal
          onClose={() => setShowNovaEmpresa(false)}
          onSave={handleNovaEmpresa}
        />
      )}

      {/* Modal Nova IA */}
      {showNovaIA && (
        <NovaIAModal
          empresas={empresas}
          onClose={() => setShowNovaIA(false)}
          onSave={handleNovaIA}
        />
      )}
    </div>
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
                  placeholder={`Nome da IA ${index + 1}`}
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
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome_empresa}
                </option>
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
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors duration-200"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};