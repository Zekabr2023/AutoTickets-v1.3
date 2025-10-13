import React, { useState } from 'react';
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
}

type ChartType = 'bar' | 'line' | 'pie';
type ComparisonType = 'status' | 'empresas';

export const AdminCharts: React.FC<AdminChartsProps> = ({ stats, empresas }) => {
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


  const getChartData = () => {
    switch (comparisonType) {
      case 'status':
        return statusData;
      case 'empresas':
        return empresasData;
      default:
        return statusData;
    }
  };

  const renderChart = () => {
    const data = getChartData();

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value, name) => {
                  if (comparisonType === 'status') {
                    return [value, 'Quantidade'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  if (comparisonType === 'status') {
                    return `Status: ${label}`;
                  }
                  return `Empresa: ${label}`;
                }}
              />
              {comparisonType === 'status' ? (
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              ) : (
                <>
                  <Bar dataKey="pendentes" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="emAnalise" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="resolvidos" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value, name) => {
                  if (comparisonType === 'status') {
                    return [value, 'Quantidade'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  if (comparisonType === 'status') {
                    return `Status: ${label}`;
                  }
                  return `Empresa: ${label}`;
                }}
              />
              {comparisonType === 'status' ? (
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
              ) : (
                <>
                  <Line type="monotone" dataKey="pendentes" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="emAnalise" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="resolvidos" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
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
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value, name) => [value, 'Quantidade']}
                labelFormatter={(label) => `Status: ${label}`}
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
            </select>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        {renderChart()}
      </div>

      {/* Legenda de Cores */}
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
    </div>
  );
};
