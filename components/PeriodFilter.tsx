import React, { useState } from 'react';
import { CalendarIcon } from './icons';

interface PeriodFilterProps {
  onPeriodChange: (startDate: Date | null, endDate: Date | null, periodName: string) => void;
}

type PeriodType = 'hoje' | '7dias' | '15dias' | '30dias' | '3meses' | '6meses' | '1ano' | 'todos';

const periods = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: '7 dias' },
  { value: '15dias', label: '15 dias' },
  { value: '30dias', label: '30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '6meses', label: '6 meses' },
  { value: '1ano', label: '1 ano' },
  { value: 'todos', label: 'Todos' },
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ onPeriodChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('todos');
  const [isOpen, setIsOpen] = useState(false);

  const getDateRange = (period: PeriodType) => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'hoje':
        start.setHours(0, 0, 0, 0);
        return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) };
      
      case '7dias':
        start.setDate(start.getDate() - 7);
        return { start, end: now };
      
      case '15dias':
        start.setDate(start.getDate() - 15);
        return { start, end: now };
      
      case '30dias':
        start.setDate(start.getDate() - 30);
        return { start, end: now };
      
      case '3meses':
        start.setMonth(start.getMonth() - 3);
        return { start, end: now };
      
      case '6meses':
        start.setMonth(start.getMonth() - 6);
        return { start, end: now };
      
      case '1ano':
        start.setFullYear(start.getFullYear() - 1);
        return { start, end: now };
      
      case 'todos':
      default:
        return { start: null, end: null };
    }
  };

  const handlePeriodSelect = (period: PeriodType) => {
    setSelectedPeriod(period);
    setIsOpen(false);
    
    const { start, end } = getDateRange(period);
    const periodName = periods.find(p => p.value === period)?.label || 'Todos';
    
    onPeriodChange(start, end, periodName);
  };

  const selectedPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label || 'Todos';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative font-semibold py-2 px-3 rounded-lg border bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 flex items-center gap-0 hover:gap-2 overflow-hidden"
        title="Filtrar por Período"
      >
        <CalendarIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
          {isOpen ? 'Fechar' : selectedPeriodLabel}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl z-50 animate-fade-in">
          <div className="py-2">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => handlePeriodSelect(period.value as PeriodType)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-indigo-600/30 text-indigo-300 border-r-2 border-indigo-500'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

