import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { ticketService } from '../lib/ticketService';
import { useToast } from './ToastProvider';

interface AdminKanbanBoardProps {
    tickets: Ticket[];
    isLoading: boolean;
    onTicketSelect: (ticket: Ticket) => void;
    onTicketUpdated: () => void;
    rules: any[];
    onEditRules: (status: TicketStatus) => void;
}

const ITEMS_PER_PAGE = 10;

const COLUMNS = [
    { id: TicketStatus.Pending, title: 'Pendentes', color: 'border-yellow-500', bg: 'bg-yellow-500/10', icon: '🕐' },
    { id: TicketStatus.InAnalysis, title: 'Em Análise', color: 'border-blue-500', bg: 'bg-blue-500/10', icon: '🔍' },
    { id: TicketStatus.AwaitingInfo, title: 'Aguardando Info', color: 'border-orange-500', bg: 'bg-orange-500/10', icon: '⏳' },
    { id: TicketStatus.Resolved, title: 'Resolvidos', color: 'border-green-500', bg: 'bg-green-500/10', icon: '✅' },
    { id: TicketStatus.Archived, title: 'Arquivados', color: 'border-gray-500', bg: 'bg-gray-500/10', icon: '📦' },
];

export const AdminKanbanBoard: React.FC<AdminKanbanBoardProps> = ({
    tickets,
    isLoading,
    onTicketSelect,
    onTicketUpdated,
    rules = [],
    onEditRules
}) => {
    const toast = useToast();
    const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
    const [, setTick] = useState(0); // Force re-render for countdown update
    const [visibleCount, setVisibleCount] = useState<Record<string, number>>({}); // Track visible items per column

    // Update countdown every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1); // Force re-render to update countdown
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    // Check for expired tickets every 30 minutes
    useEffect(() => {
        const checkTacitAcceptance = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/tickets/process-tacit-acceptance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (data.resolved > 0) {
                    console.log(`[Tacit Acceptance] Auto-resolved ${data.resolved} ticket(s)`);
                    onTicketUpdated(); // Refresh the board
                }
            } catch (error) {
                console.error('[Tacit Acceptance] Error checking:', error);
            }
        };

        // Check immediately on mount
        checkTacitAcceptance();

        // Then check every 30 minutes
        const interval = setInterval(checkTacitAcceptance, 30 * 60 * 1000);

        return () => clearInterval(interval);
    }, [onTicketUpdated]);

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        e.dataTransfer.setData('ticketId', ticketId);
        setDraggedTicketId(ticketId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: TicketStatus) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        setDraggedTicketId(null);

        if (!ticketId) return;

        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        if (ticket.status === targetStatus) return; // No change

        // Optimistic Update (optional, but good for UX - handled by parent refresh usually)
        // Here we just call the service
        try {
            await ticketService.atualizarStatus(ticketId, targetStatus);
            onTicketUpdated();
        } catch (error) {
            console.error('Erro ao mover ticket:', error);
            toast.error('Erro ao atualizar status do ticket.');
        }
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.Pending: return 'text-yellow-400 bg-yellow-500/20';
            case TicketStatus.InAnalysis: return 'text-blue-400 bg-blue-500/20';
            case TicketStatus.AwaitingInfo: return 'text-orange-400 bg-orange-500/20';
            case TicketStatus.Resolved: return 'text-green-400 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getUrgenciaColor = (urgencia: string) => {
        switch (urgencia) {
            case 'Crítica': return 'text-red-400 bg-red-500/20';
            case 'Alta': return 'text-orange-400 bg-orange-500/20';
            case 'Média': return 'text-yellow-400 bg-yellow-500/20';
            case 'Baixa': return 'text-green-400 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    // Calculate remaining time for tacit acceptance (48h countdown)
    const getCountdownInfo = (ticket: Ticket): { remaining: number; formatted: string; isUrgent: boolean } | null => {
        if (ticket.status !== TicketStatus.AwaitingInfo) {
            return null;
        }

        // Determine start time with fallbacks:
        // 1. aguardandoInfoDesde (ideal - set when moved to AwaitingInfo)
        // 2. Last admin message in chatHistory (when admin asked for info)
        // 3. createdAt (last resort)
        let startTime: number;

        if (ticket.aguardandoInfoDesde) {
            startTime = new Date(ticket.aguardandoInfoDesde).getTime();
        } else if (ticket.chatHistory && ticket.chatHistory.length > 0) {
            // Find last admin message
            const lastAdminMessage = [...ticket.chatHistory].reverse().find(msg => msg.sender === 'Admin');
            startTime = lastAdminMessage
                ? new Date(lastAdminMessage.timestamp).getTime()
                : new Date(ticket.createdAt).getTime();
        } else {
            // Use createdAt as fallback
            startTime = new Date(ticket.createdAt).getTime();
        }

        const deadline = startTime + (48 * 60 * 60 * 1000); // 48 hours in ms
        const now = Date.now();
        const remaining = deadline - now;

        if (remaining <= 0) {
            return { remaining: 0, formatted: '⏰ EXPIRADO', isUrgent: true };
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        const formatted = hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes}m`;

        // Urgent if less than 6 hours
        const isUrgent = hours < 6;

        return { remaining, formatted, isUrgent };
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-white text-lg">Carregando quadro...</div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
            {COLUMNS.map((col) => {
                const columnTickets = tickets.filter(t => t.status === col.id);
                const hasRules = rules.some((r: any) => r.status === col.id);
                const currentVisible = visibleCount[col.id] || ITEMS_PER_PAGE;
                const visibleTickets = columnTickets.slice(0, currentVisible);
                const hasMore = columnTickets.length > currentVisible;
                const remaining = columnTickets.length - currentVisible;

                return (
                    <div
                        key={col.id}
                        className={`flex-shrink-0 w-[240px] bg-gray-900/50 rounded-xl border border-gray-700 flex flex-col`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Header */}
                        <div className={`p-3 border-b border-gray-700 flex justify-between items-center ${col.bg} rounded-t-xl group/header`}>
                            <h3 className="font-bold text-gray-100 flex items-center gap-2 text-sm">
                                <span>{col.icon}</span>
                                {col.title}
                                {hasRules && (
                                    <span title="Regras ativas" className="text-yellow-400 text-xs animate-pulse">🔔</span>
                                )}
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onEditRules(col.id)}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors opacity-50 group-hover/header:opacity-100"
                                    title="Configurar regras para esta coluna"
                                >
                                    ⚙️
                                </button>
                                <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-600">
                                    {columnTickets.length}
                                </span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3">
                            {visibleTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                                    onClick={() => onTicketSelect(ticket)}
                                    className={`
                    bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer 
                    hover:border-indigo-500 hover:shadow-lg transition-all duration-200
                    active:cursor-grabbing group
                    ${draggedTicketId === ticket.id ? 'opacity-50 ring-2 ring-indigo-500' : ''}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-gray-500">#{String(ticket.numero).padStart(4, '0')}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${getUrgenciaColor(ticket.urgency)}`}>
                                            {ticket.urgency}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-semibold text-gray-200 mb-1 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                                        {ticket.title}
                                    </h4>

                                    <div className="flex items-center gap-1 mb-2">
                                        <span className="text-xs text-gray-400 truncate max-w-[150px]" title={ticket.empresaNome}>
                                            🏢 {ticket.empresaNome || 'Empresa'}
                                        </span>
                                    </div>

                                    {/* Countdown Timer for Awaiting Info */}
                                    {ticket.status === TicketStatus.AwaitingInfo && (() => {
                                        const countdown = getCountdownInfo(ticket);
                                        if (!countdown) return null;

                                        return (
                                            <div className={`
                                                flex items-center justify-center gap-2 py-2 px-3 rounded-lg mb-2
                                                ${countdown.isUrgent
                                                    ? 'bg-red-500/20 border border-red-500/50'
                                                    : 'bg-orange-500/20 border border-orange-500/50'}
                                            `}>
                                                <span className={`text-lg ${countdown.isUrgent ? 'animate-pulse' : ''}`}>⏱️</span>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${countdown.isUrgent ? 'text-red-400' : 'text-orange-400'}`}>
                                                        {countdown.formatted}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">Aceitação Tácita</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700/50">
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                        {/* Visual indicator for drag (icon) */}
                                        <div className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <button
                                    onClick={() => setVisibleCount(prev => ({
                                        ...prev,
                                        [col.id]: (prev[col.id] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
                                    }))}
                                    className="w-full py-2 px-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>➕</span>
                                    +10 ({remaining} restantes)
                                </button>
                            )}

                            {/* Collapse Button */}
                            {currentVisible > ITEMS_PER_PAGE && (
                                <button
                                    onClick={() => setVisibleCount(prev => ({ ...prev, [col.id]: ITEMS_PER_PAGE }))}
                                    className="w-full py-1.5 px-3 bg-gray-800/30 hover:bg-gray-700/30 border border-gray-700/50 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    Recolher
                                </button>
                            )}

                            {columnTickets.length === 0 && (
                                <div className="h-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-gray-800 rounded-lg">
                                    <p className="text-gray-600 text-sm">Arraste para cá</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
