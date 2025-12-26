import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Ticket } from '../types';

interface AdminChartsProps {
  stats: {
    totalEmpresas: number;
    totalTickets: number;
    ticketsPendentes: number;
    ticketsEmAnalise: number;
    ticketsResolvidos: number;
    ticketsHoje: number;
  };
  empresas: Array<{
    id: string;
    nome: string;
    tickets_pendentes: number;
    tickets_em_analise: number;
    tickets_resolvidos: number;
  }>;
  tickets?: Ticket[];
}

type ChartType = 'bar' | 'line' | 'pie';
type ComparisonType = 'status' | 'empresas' | 'evolution';

export const AdminCharts: React.FC<AdminChartsProps> = ({ stats, empresas, tickets = [] }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('status');

  // Dados para gráfico de status
  const statusData = [
    { name: 'Pendentes', value: stats.ticketsPendentes, color: '#f59e0b' },
    { name: 'Em Análise', value: stats.ticketsEmAnalise, color: '#3b82f6' },
    { name: 'Resolvidos', value: stats.ticketsResolvidos, color: '#10b981' },
  ];

  // Dados para gráfico de empresas
  const empresasData = empresas.map(empresa => ({
    name: empresa.nome,
    pendentes: empresa.tickets_pendentes,
    emAnalise: empresa.tickets_em_analise,
    resolvidos: empresa.tickets_resolvidos,
    total: empresa.tickets_pendentes + empresa.tickets_em_analise + empresa.tickets_resolvidos,
  }));

  // Aggregation Logic for Evolution (Monthly)
  const evolutionData = useMemo(() => {
    const months: Record<string, number> = {};

    tickets.forEach(ticket => {
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // e.g., 12/2025
        months[key] = (months[key] || 0) + 1;
      }
    });

    // Sort by date logic (simple parsing since format is M/YYYY)
    return Object.entries(months)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [ma, ya] = a.name.split('/').map(Number);
        const [mb, yb] = b.name.split('/').map(Number);
        return (ya * 100 + ma) - (yb * 100 + mb);
      });
  }, [tickets]);




  const getChartData = () => {
    switch (comparisonType) {
      case 'status': return statusData;
      case 'empresas': return empresasData;
      case 'evolution': return evolutionData;
      default: return statusData;
    }
  };

  const renderChart = () => {
    const data = getChartData();

    // Force Line chart for Evolution if not explicitly changed (optional UX)
    // But keeping it flexible with chartType state is fine.

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout={comparisonType === 'requesters' ? 'vertical' : 'horizontal'}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              {comparisonType === 'requesters' ? (
                <>
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                </>
              )}

              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
                formatter={(value: any, name: string) => [value, name === 'value' ? 'Tickets' : name]}
              />
              {comparisonType === 'status' ? (
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              ) : comparisonType === 'empresas' ? (
                <>
                  <Bar dataKey="pendentes" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="emAnalise" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="resolvidos" stackId="a" fill="#10b981" />
                </>
              ) : (
                // Evolution chart
                <>
                  <Bar dataKey="value" name="Tickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Legend />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
              />
              {comparisonType === 'empresas' ? (
                <>
                  <Line type="monotone" dataKey="pendentes" stroke="#f59e0b" />
                  <Line type="monotone" dataKey="emAnalise" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="resolvidos" stroke="#10b981" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="value" name="Tickets" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
                  <Legend />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey={comparisonType === 'empresas' ? 'total' : 'value'}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">📊 Análises Visuais</h2>

        {/* Controles */}
        <div className="flex gap-4">
          {/* Tipo de Gráfico */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Tipo:</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="bar">Barras</option>
              <option value="line">Linha</option>
              <option value="pie">Pizza</option>
            </select>
          </div>

          {/* Tipo de Comparação */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Comparar:</label>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="status">Status</option>
              <option value="empresas">Empresas</option>
              <option value="evolution">Evolução Mensal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        {renderChart()}
      </div>

      {/* Legenda de Cores (apenas para status/empresas fixos) */}
      {(comparisonType === 'status' || comparisonType === 'empresas') && (
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Pendentes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Em Análise</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Resolvidos</span>
          </div>
        </div>
      )}
    </div>
  );
};
